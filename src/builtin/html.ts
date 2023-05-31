import { InlineRenderResult, rh } from '../core/core';
import { Fragment } from './Fragment';

type HTMLTemplateToken = {
  type:
    | 'text'
    | 'start'
    | 'end_start'
    | 'end'
    | 'tag'
    | 'tag_end'
    | 'attr'
    | 'value'
    | 'equal';
  value: string;
};
type TokenizerState = 'text' | 'start' | 'end_start' | 'tag' | 'value';

//
// TODO: This is function need unit test
//
// Parse incomplete html and get tokens
function tokenize(html: string, init_state = 'text' as TokenizerState) {
  let tokens = [] as HTMLTemplateToken[];

  // Traverse html characters, lexical analysis, parse into tokens, tokens have different types
  let state = init_state; // Define a state variable to record the current parsing type, initially text type
  let buffer = ''; // Define a buffer variable to store the current parsed characters
  for (let char of html) {
    // Traverse each character
    switch (
      state // Perform different processing according to the state
    ) {
      case 'text': // If it is text type
        if (char === '<') {
          // If you encounter a left angle bracket
          if (buffer) {
            // If the buffer variable is not empty
            tokens.push({ type: 'text', value: buffer }); // Add the buffer variable as a text type token to the array
            buffer = ''; // Empty the buffer variable
          }
          tokens.push({ type: 'start', value: '<' });
          state = 'start'; // Change the state to tag type
        } else if (char === '>') {
          // If you encounter a right angle bracket
          throw new Error(`Unexpected character found while parsing: ${char}`);
        } else {
          // If you don't encounter a left angle bracket
          buffer += char; // Add the character to the buffer variable
        }
        break;
      case 'start':
        if (char === '/') {
          tokens.pop();
          tokens.push({ type: 'end_start', value: '</' });
          state = 'end_start';
        } else {
          tokens.pop();
          buffer += char; // Add the character to the buffer variable
          state = 'tag';
        }
        break;
      case 'end_start':
        if (char === '>') {
          // If you encounter
          tokens.pop();
          tokens.push({ type: 'tag_end', value: buffer });
          buffer = '';
          state = 'text';
        } else {
          buffer += char; // Add the character to the buffer variable
        }
        break;
      case 'tag': // If it is tag type
        switch (
          char // Perform different processing according to the character
        ) {
          case '>': // If you encounter a right angle bracket
            if (!buffer) {
              state = 'text'; // If the buffer variable is not empty
              // tokens.push({type: "tag_end", value: '>'});
              break;
            }
            tokens.push({ type: 'tag', value: buffer }); // Add the buffer variable as a tag type token to the array
            buffer = ''; // Empty the buffer variable
            state = 'text'; // Change the state to text type
            break;
          case '=': // If you encounter an equal sign
            if (buffer) {
              // If the buffer variable is not empty
              tokens.push({ type: 'attr', value: buffer }); // Add the buffer variable as an attribute name type token to the array
              buffer = ''; // Empty the buffer variable
            }
            tokens.push({ type: 'equal', value: char }); // Add the equal sign as an equal type token to the array
            break;
          case '"': // If you encounter a double quote
            state = 'value'; // Change the state to attribute value type
            break;
          case ' ': // If you encounter a space
            if (buffer.trim()) {
              // If the buffer variable is not empty
              tokens.push({ type: 'tag', value: buffer.trim() }); // Add the buffer variable as a tag type token to the array
            }
            buffer = ''; // Empty the buffer variable
            break;
          case '/': {
            tokens.push({ type: 'tag', value: buffer });
            buffer = '';
            tokens.push({ type: 'end_start', value: '</' });
            state = 'end_start';
            break;
          }
          default: // If it is other characters
            buffer += char; // Add the character to the buffer variable
        }
        break;
      case 'value': // If it is attribute value type
        if (char === '"') {
          // If you encounter a double quote
          tokens.push({ type: 'value', value: buffer }); // Add the buffer variable as an attribute value type token to the array
          buffer = ''; // Empty the buffer variable
          state = 'tag'; // Change the state to tag type
        } else {
          // If it is other characters
          buffer += char; // Add the character to the buffer variable
        }
        break;
    }
  }
  if (buffer) {
    tokens.push({
      type: 'text',
      value: buffer,
    });
  }
  return tokens;
}

const tokenizeTemplate = (strings: TemplateStringsArray, ...values: any[]) => {
  const all_tokens = [];

  let state = 'text' as TokenizerState;
  for (let idx = 0; idx < strings.length; idx++) {
    const string = strings[idx];
    const value = values[idx];
    const tokens = tokenize(string, state);
    if (tokens.length === 0) continue;

    all_tokens.push(...tokens);

    if (!value) {
      continue;
    }

    const tailToken = tokens[tokens.length - 1];
    switch (tailToken.type) {
      case 'equal': {
        all_tokens.push({
          type: 'value',
          value,
        });
        state = 'tag';
        break;
      }
      case 'start': {
        all_tokens.push({
          type: 'tag',
          value,
        });
        state = 'tag';
        break;
      }
      case 'tag':
      case 'text': {
        all_tokens.push({
          type: 'text',
          value,
        });
        state = 'text';
        break;
      }
      default: {
        throw new Error(`Unexpected token`);
      }
    }
  }
  return all_tokens;
};

type HTMLTemplateNode = {
  tag: any;
  attributes: any;
  children: HTMLTemplateNode[];
};

function htmlRoot(strings: TemplateStringsArray, ...values: any[]) {
  const root = {
    tag: 'ROOT',
    attributes: {},
    children: [],
  } as HTMLTemplateNode;
  const stack = [root];
  const current = () => stack[stack.length - 1];

  const tokens = tokenizeTemplate(strings, ...values);

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];
    const node = current();
    const { type, value } = token;
    switch (type) {
      case 'tag': {
        const child = {
          tag: value,
          attributes: {},
          children: [],
        };
        node.children.push(child);
        stack.push(child);
        break;
      }
      case 'value': {
        const keyNode = tokens[idx - 2];
        node.attributes[keyNode.value] = value;
        break;
      }
      case 'text': {
        node.children.push(value);
        break;
      }
      case 'tag_end': {
        const popNode = stack.pop();
        if (
          token.value &&
          token.value !== '/' &&
          popNode?.tag !== token.value
        ) {
          throw new Error(`Unexpected token ${token.value} at ${popNode?.tag}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return root;
}

export const html = (strings: TemplateStringsArray, ...values: any[]) => {
  const root = htmlRoot(strings, ...values);
  const walk = (
    node: HTMLTemplateNode | string | number | boolean | null | void | undefined
  ): InlineRenderResult => {
    if (node === undefined || node === null) {
      return null;
    }
    if (typeof node === 'object' && node.attributes && node.children) {
      return rh(node.tag, node.attributes, node.children.map(walk));
    }
    return node as any;
  };
  root.tag = Fragment;
  return walk(root);
};
