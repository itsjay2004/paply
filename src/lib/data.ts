import type { Paper, Collection } from './types';

export const collections: Collection[] = [
  { id: '1', name: 'Machine Learning', paperCount: 2 },
  { id: '2', name: 'Quantum Computing', paperCount: 1 },
  { id: '3', name: 'Neuroscience', paperCount: 0 },
  { id: '4', name: 'Climate Change', paperCount: 0 },
];

export const papers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    year: 2017,
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.',
    summary: [
      "Proposes the Transformer, a novel network architecture based solely on attention mechanisms.",
      "Dispenses with recurrence and convolutions, leading to more parallelizable and faster training.",
      "Achieves state-of-the-art results on machine translation tasks, outperforming previous models."
    ],
    pdfUrl: '/placeholder.pdf',
    tags: ['deep-learning', 'nlp', 'transformer'],
    collection_id: '1',
    collectionIds: ['1'],
    doi: '10.48550/arXiv.1706.03762',
    source: 'Cornell University',
  },
  {
    id: '2',
    title: 'A quantum algorithm for factoring integers',
    authors: ['Peter W. Shor'],
    year: 1994,
    abstract: 'A digital computer is generally believed to be an efficient universal computing device; that is, it is believed to be able to simulate any physical computing device with an increase in computation time by at most a polynomial factor. This may not be true when quantum mechanics is taken into consideration. This paper considers factoring integers and finding discrete logarithms, two problems which are generally thought to be hard on a classical computer and which have been used as the basis of several proposed cryptosystems. Efficient randomized algorithms are given for these two problems on a hypothetical quantum computer. These algorithms take a number of steps polynomial in the input size, e.g., the number of digits of the integer to be factored.',
    summary: [],
    pdfUrl: '/placeholder.pdf',
    tags: ['quantum-computing', 'cryptography', 'algorithms'],
    collection_id: '2',
    collectionIds: ['2'],
    doi: '10.1109/SFCS.1994.365700',
    source: 'IEEE',
  },
  {
    id: '3',
    title: 'Generative Adversarial Nets',
    authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
    year: 2014,
    abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G. The training procedure for G is to maximize the probability of D making a mistake. This framework corresponds to a minimax two-player game. In the space of arbitrary functions G and D, a unique solution exists, with G recovering the training data distribution and D equal to 1/2 everywhere. In the case where G and D are defined by multilayer perceptrons, the entire system can be trained with backpropagation. There is no need for any Markov chains or unrolled approximate inference networks during either training or generation of samples. Experiments demonstrate the potential of the framework through qualitative and quantitative evaluation of the generated samples.',
    summary: [],
    pdfUrl: '/placeholder.pdf',
    tags: ['gan', 'generative-models', 'deep-learning'],
    collection_id: '1',
    collectionIds: ['1'],
    doi: '10.48550/arXiv.1406.2661',
    source: 'Cornell University',
  },
];
