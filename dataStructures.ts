import type { Question } from '../types';

// Trie implementation for organizing topics and finding related topics
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfTopic: boolean;
  questions: Question[];

  constructor() {
    this.children = new Map();
    this.isEndOfTopic = false;
    this.questions = [];
  }
}

export class TopicTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(topic: string, question: Question) {
    let node = this.root;
    const words = topic.toLowerCase().split(' ');

    for (const word of words) {
      if (!node.children.has(word)) {
        node.children.set(word, new TrieNode());
      }
      node = node.children.get(word)!;
    }

    node.isEndOfTopic = true;
    node.questions.push(question);
  }

  search(topic: string): Question[] {
    let node = this.root;
    const words = topic.toLowerCase().split(' ');

    for (const word of words) {
      if (!node.children.has(word)) {
        return [];
      }
      node = node.children.get(word)!;
    }

    // Get questions from this topic and related topics
    const questions: Question[] = [];
    if (node.isEndOfTopic) {
      questions.push(...node.questions);
    }

    // Find related topics by exploring sibling nodes
    node.children.forEach((childNode) => {
      if (childNode.isEndOfTopic) {
        questions.push(...childNode.questions);
      }
    });

    return questions;
  }

  // Find all topics that share a common prefix
  findRelatedTopics(prefix: string): string[] {
    let node = this.root;
    const words = prefix.toLowerCase().split(' ');

    for (const word of words) {
      if (!node.children.has(word)) {
        return [];
      }
      node = node.children.get(word)!;
    }

    const topics: string[] = [];
    this.collectTopics(node, prefix, topics);
    return topics;
  }

  private collectTopics(node: TrieNode, currentPrefix: string, topics: string[]) {
    if (node.isEndOfTopic) {
      topics.push(currentPrefix);
    }

    node.children.forEach((childNode, char) => {
      this.collectTopics(childNode, `${currentPrefix} ${char}`.trim(), topics);
    });
  }
}

// MinHeap implementation for sorting questions by difficulty
export class QuestionHeap {
  private heap: Question[];

  constructor() {
    this.heap = [];
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number): void {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  private difficultyScore(difficulty: string): number {
    const scores = { easy: 1, medium: 2, hard: 3 };
    return scores[difficulty as keyof typeof scores] || 2;
  }

  insert(question: Question): void {
    this.heap.push(question);
    this.heapifyUp(this.heap.length - 1);
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (
        this.difficultyScore(this.heap[index].difficulty) <
        this.difficultyScore(this.heap[parentIndex].difficulty)
      ) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  extractMin(): Question | undefined {
    if (this.heap.length === 0) return undefined;
    
    const min = this.heap[0];
    const last = this.heap.pop()!;
    
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    
    return min;
  }

  private heapifyDown(index: number): void {
    while (true) {
      let smallest = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      if (
        leftChild < this.heap.length &&
        this.difficultyScore(this.heap[leftChild].difficulty) <
        this.difficultyScore(this.heap[smallest].difficulty)
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.difficultyScore(this.heap[rightChild].difficulty) <
        this.difficultyScore(this.heap[smallest].difficulty)
      ) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  size(): number {
    return this.heap.length;
  }
}

// Hash table for quick question lookup and duplicate prevention
export class QuestionHashTable {
  private table: Map<string, Question>;

  constructor() {
    this.table = new Map();
  }

  add(question: Question): void {
    const key = this.generateKey(question);
    this.table.set(key, question);
  }

  has(question: Question): boolean {
    const key = this.generateKey(question);
    return this.table.has(key);
  }

  get(question: Question): Question | undefined {
    const key = this.generateKey(question);
    return this.table.get(key);
  }

  clear(): void {
    this.table.clear();
  }

  private generateKey(question: Question): string {
    // Create a unique key based on question text and topic
    return `${question.topic}-${question.text}`.toLowerCase().trim();
  }
}