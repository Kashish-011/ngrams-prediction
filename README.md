# ◈ NGRAMS PREDICTION

## 🌐 Live Demo

Try the NGRAMS Prediction application:

https://ngrams-prediction.onrender.com

### Statistical Language Intelligence using N-Gram NLP

**NGRAMS PREDICTION** is an interactive Natural Language Processing (NLP) web application that learns statistical word relationships directly from a user-provided text corpus and predicts the next word using **Unigram, Bigram, and Trigram language models**.

The project combines a Python/Flask backend with a custom HTML/CSS/JavaScript interface and an interactive Three.js language network.

> **From corpus → tokens → N-grams → probabilities → prediction.**

---

## ✨ Features

- 🧠 **Corpus-driven NLP** — the model learns from the text entered by the user.
- 🔤 **Tokenization** — converts raw text into language tokens.
- 1️⃣ **Unigram model** — calculates individual word frequencies and probabilities.
- 2️⃣ **Bigram model** — learns sequential two-word relationships.
- 3️⃣ **Trigram model** — learns three-word context relationships.
- 📊 **Conditional probability** — calculates `P(next word | previous word)` and trigram probabilities.
- 🔮 **Next-word prediction** — uses Trigram prediction first and falls back to Bigram prediction when needed.
- 🌌 **Interactive Language Constellation** — visualizes words and their learned Bigram relationships in 3D.
- 🔎 **NLP network metadata** — word frequency, unigram probability, outgoing relationships, and strongest next-word transition are available to the visualization.
- 🎨 **Custom product-style UI** — built with HTML, CSS and JavaScript instead of a standard Streamlit dashboard.
- 📱 **Responsive layout** — adapts to smaller screens.

---

## 🧠 NLP Concept Behind the Project

The application implements a classical statistical language-modeling approach.

### 1. Tokenization

The input corpus is converted into a sequence of tokens:

```text
"Machine learning helps computers learn."

→ machine | learning | helps | computers | learn
```

### 2. Unigram

A unigram contains one token.

The unigram probability is:

```text
P(w) = Count(w) / Total Tokens
```

Example:

```text
machine appears 3 times
Total tokens = 30

P(machine) = 3 / 30 = 0.10
```

### 3. Bigram

A bigram contains two consecutive tokens.

```text
machine learning
learning helps
helps computers
```

The conditional probability is:

```text
P(w₂ | w₁) = Count(w₁, w₂) / Count(w₁)
```

For example:

```text
P(learning | machine)
= Count(machine, learning) / Count(machine)
```

### 4. Trigram

A trigram contains three consecutive tokens.

```text
machine learning helps
learning helps computers
```

The model uses:

```text
P(w₃ | w₁, w₂)
= Count(w₁, w₂, w₃) / Count(w₁, w₂)
```

### 5. Next-word Prediction

For a phrase such as:

```text
machine learning
```

the application first searches for a matching trigram context:

```text
machine learning → ?
```

If no trigram candidate exists, it falls back to a Bigram context:

```text
learning → ?
```

This is called a **Trigram → Bigram backoff strategy** in this implementation.

---

## 🌌 Language Constellation

The 3D visualization is connected to the NLP model rather than being a decorative animation.

### Nodes

Each node represents a word/token from the corpus.

Node information is derived from:

- Word frequency
- Unigram probability
- Number of outgoing learned relationships
- Strongest next-word relationship

### Edges

Each connection represents a learned **Bigram**:

```text
machine → learning
```

The edge probability represents:

```text
P(learning | machine)
```

Therefore, the visualization can be explained as a **visual representation of the statistical language model**.

---

## 🏗️ System Architecture

```text
                    USER
                     │
                     ▼
              ┌─────────────┐
              │   CORPUS    │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ TOKENIZATION│
              └──────┬──────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      UNIGRAM     BIGRAM     TRIGRAM
          │          │          │
          └──────────┼──────────┘
                     ▼
             PROBABILITY MODEL
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   LANGUAGE NETWORK       PREDICTION ENGINE
          │                     │
          ▼                     ▼
     THREE.JS 3D          NEXT WORDS
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python |
| Web framework | Flask |
| NLP | Python `re` + `collections.Counter` |
| Frontend | HTML5 |
| Styling | CSS3 |
| Interaction | JavaScript |
| 3D visualization | Three.js |
| Fonts | Google Fonts |
| API communication | JSON / Fetch API |

---

## 📁 Project Structure

```text
ngrams_prediction/
│
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── templates/
│   └── index.html
│
└── static/
    ├── app.js
    └── style.css
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ngrams-prediction.git
```

### 2. Enter the project directory

```bash
cd ngrams-prediction
```

### 3. Create a virtual environment (recommended)

Windows:

```powershell
python -m venv venv
venv\Scripts\activate
```

macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the application

```bash
python app.py
```

Open the URL shown by Flask, normally:

```text
http://127.0.0.1:5000
```

---

## 🚀 How to Use

1. Open the application.
2. Enter or paste your own corpus into **Live Corpus**.
3. Click **Analyze Corpus**.
4. Inspect:
   - token count
   - vocabulary size
   - unique bigrams
   - unique trigrams
   - vocabulary density
5. Explore the **Language Constellation**.
6. Examine Unigram, Bigram and Trigram probability tables.
7. Enter a phrase in **Next Word Prediction**.
8. Compare the predicted words and their probabilities.

### Example

Corpus:

```text
Artificial intelligence is transforming education.
Machine learning helps computers learn from data.
Artificial intelligence uses machine learning algorithms.
Machine learning models learn patterns from data.
Natural language processing helps computers understand language.
```

Try:

```text
machine learning
```

The prediction engine searches the corpus for the corresponding learned context and ranks available next words.

---

## 🔬 Example NLP Demonstration

A useful project demonstration is to analyze two completely different corpora.

### Corpus A — Artificial Intelligence

Use text about:

```text
artificial intelligence
machine learning
data
neural networks
natural language processing
```

The language network should contain AI-related vocabulary and relationships.

### Corpus B — Football

Replace the corpus with text about:

```text
football
players
team
goal
striker
midfielders
defenders
```

Analyze again.

The vocabulary, N-grams, probabilities, network and predictions change because the model learns from the **new corpus**.

This demonstrates that the application is a corpus-driven statistical language model rather than a fixed topic classifier.

---

## 📌 API Endpoints

### Analyze Corpus

```text
POST /api/analyze
```

Example request:

```json
{
  "corpus": "machine learning helps computers learn from data",
  "removePunctuation": true,
  "maxNodes": 55
}
```

### Predict Next Word

```text
POST /api/predict
```

Example request:

```json
{
  "corpus": "machine learning helps computers learn from data",
  "phrase": "machine learning",
  "limit": 5,
  "removePunctuation": true
}
```

---

## ⚠️ Current Limitations

- The model is a **classical N-gram statistical model**, not a pretrained transformer/LLM.
- Predictions depend strongly on the corpus supplied by the user.
- Unseen contexts cannot produce a learned prediction unless a Bigram fallback is available.
- There is no smoothing technique such as Laplace smoothing in the current implementation.
- The current application is intended primarily for local/educational demonstration.
- Three.js and Google Fonts are loaded from CDNs, so those visual resources require network access in the browser.

---

## 🔮 Future Improvements

Possible future extensions include:

- Laplace/add-one smoothing
- Kneser-Ney smoothing
- Larger configurable N-gram orders
- Corpus file upload (`.txt`, `.csv`)
- Stop-word analysis
- Word-frequency heatmaps
- Bigram probability heatmaps
- Clickable 3D nodes with detailed NLP statistics
- Prediction confidence visualization
- Model comparison between N=1, N=2 and N=3
- Exportable analysis reports
- User-selectable corpus history
- Production deployment

---

## 🎓 Educational Purpose

This project demonstrates the fundamentals of **Natural Language Processing and Statistical Language Modeling**, including:

- Text preprocessing
- Tokenization
- Frequency analysis
- Unigram language models
- Bigram language models
- Trigram language models
- Conditional probability
- Next-word prediction
- Backoff prediction
- Interactive NLP visualization

It is especially suitable for demonstrating how a simple statistical NLP model can learn language patterns directly from a corpus.

---

## 👩‍💻 Author
**Kashish Siddiqui**
**NGRAMS PREDICTION**

A student/academic NLP project demonstrating statistical language modeling with an interactive web interface.

---

## 📄 License

This project is intended for educational and academic use. Add a formal open-source license (for example, MIT) if you plan to distribute the project publicly.
