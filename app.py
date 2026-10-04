
from flask import Flask, render_template, request, jsonify
import re
from collections import Counter

app = Flask(__name__)

DEFAULT_CORPUS = """Artificial intelligence is transforming education.
Machine learning helps systems learn from data.
Natural language processing helps computers understand human language.
Language models use probability to predict the next word.
Students use artificial intelligence tools to learn faster.
Data, algorithms, and probability are important parts of machine learning."""


def tokenize(text, remove_punctuation=True):
    text = (text or "").lower().strip()
    tokens = re.findall(r"[A-Za-z0-9_]+(?:'[A-Za-z0-9_]+)?|[^\w\s]", text)
    if remove_punctuation:
        tokens = [t for t in tokens if re.search(r"[A-Za-z0-9]", t)]
    return tokens


def ngrams(tokens, n):
    return [tuple(tokens[i:i+n]) for i in range(max(0, len(tokens)-n+1))]


def build_model(tokens):
    uni = Counter(tokens)
    bi = Counter(ngrams(tokens, 2))
    tri = Counter(ngrams(tokens, 3))
    return uni, bi, tri


def model_payload(text, remove_punctuation=True, max_nodes=55):
    tokens = tokenize(text, remove_punctuation)
    uni, bi, tri = build_model(tokens)

    total = len(tokens)
    vocab = len(uni)

    unigram = [
        {"word": w, "count": c, "probability": c/total if total else 0}
        for w, c in uni.items()
    ]
    unigram.sort(key=lambda x: (-x["probability"], x["word"]))

    bigram = []
    for (a, b), c in bi.items():
        bigram.append({
            "previous": a,
            "next": b,
            "count": c,
            "probability": c / uni[a] if uni[a] else 0
        })
    bigram.sort(key=lambda x: (-x["probability"], -x["count"], x["next"]))

    trigram = []
    for (a, b, c), count in tri.items():
        trigram.append({
            "context": f"{a} {b}",
            "next": c,
            "count": count,
            "probability": count / bi[(a, b)] if bi[(a, b)] else 0
        })
    trigram.sort(key=lambda x: (-x["probability"], -x["count"], x["next"]))

    words = [w for w, _ in uni.most_common(max_nodes)]
    word_set = set(words)
    edges = Counter()
    for a, b in zip(tokens, tokens[1:]):
        if a in word_set and b in word_set and a != b:
            edges[(a, b)] += 1

    # NLP metadata for the interactive language network.
    # Each node exposes unigram frequency and its strongest conditional next-word relation.
    node_meta = []
    for w in words:
        outgoing = [(b, c) for (a, b), c in bi.items() if a == w and b in word_set]
        outgoing.sort(key=lambda x: (-x[1], x[0]))
        best_next, best_count = outgoing[0] if outgoing else (None, 0)
        node_meta.append({
            "word": w,
            "frequency": uni[w],
            "unigram_probability": uni[w] / total if total else 0,
            "degree": len(outgoing),
            "best_next": best_next,
            "transition_probability": best_count / uni[w] if best_next and uni[w] else 0
        })

    edge_payload = []
    for (a, b), c in edges.most_common(160):
        edge_payload.append({
            "source": a,
            "target": b,
            "weight": c,
            "probability": c / uni[a] if uni[a] else 0,
            "ngram": "BIGRAM"
        })

    return {
        "stats": {
            "tokens": total,
            "vocabulary": vocab,
            "bigrams": len(bi),
            "trigrams": len(tri),
            "density": (vocab / total * 100) if total else 0
        },
        "tokens": tokens[:500],
        "unigram": unigram[:40],
        "bigram": bigram[:60],
        "trigram": trigram[:60],
        "nodes": node_meta,
        "edges": edge_payload
    }


def predict(text, phrase, limit=5, remove_punctuation=True):
    tokens = tokenize(text, remove_punctuation)
    context = tokenize(phrase, True)
    uni, bi, tri = build_model(tokens)

    if not context:
        return []

    candidates = []

    if len(context) >= 2:
        pair = tuple(context[-2:])
        for (a, b, c), count in tri.items():
            if (a, b) == pair:
                candidates.append({
                    "word": c,
                    "probability": count / bi[(a, b)],
                    "count": count,
                    "model": "TRIGRAM"
                })

    if not candidates:
        last = context[-1]
        for (a, b), count in bi.items():
            if a == last:
                candidates.append({
                    "word": b,
                    "probability": count / uni[a],
                    "count": count,
                    "model": "BIGRAM"
                })

    candidates.sort(key=lambda x: (-x["probability"], -x["count"], x["word"]))
    return candidates[:limit]


@app.route("/")
def index():
    return render_template("index.html", default_corpus=DEFAULT_CORPUS)


@app.post("/api/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    text = data.get("corpus", "")
    remove_punctuation = bool(data.get("removePunctuation", True))
    max_nodes = int(data.get("maxNodes", 55))

    if not text.strip():
        return jsonify({"error": "Please enter a corpus."}), 400

    return jsonify(model_payload(text, remove_punctuation, max_nodes))


@app.post("/api/predict")
def next_word():
    data = request.get_json(silent=True) or {}
    text = data.get("corpus", "")
    phrase = data.get("phrase", "")
    limit = int(data.get("limit", 5))
    remove_punctuation = bool(data.get("removePunctuation", True))

    if not text.strip() or not phrase.strip():
        return jsonify({"error": "Corpus and prediction context are required."}), 400

    return jsonify({
        "context": phrase,
        "predictions": predict(
            text, phrase, limit, remove_punctuation
        )
    })


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
