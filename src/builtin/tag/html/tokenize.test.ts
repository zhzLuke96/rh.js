import { tokenizeHTML, tokenizeHTMLTemplate } from './tokenize';

const removeIndex = (array: any[], trim = false) =>
  array.map((x) => {
    delete x.index;
    if (trim && typeof x.value === 'string') {
      x.value = x.value.trim();
    }
    return x;
  });

describe('tokenize', () => {
  it('should tokenize a simple html tag', () => {
    const html = '<div>hello world</div>';
    const expectedTokens = [
      { type: 'tag', value: 'div', index: { string: 5 } },
      { type: 'text', value: 'hello world', index: { string: 17 } },
      { type: 'tag_end', value: 'div', index: { string: 22 } },
    ];

    const tokens = tokenizeHTML(html);

    expect(tokens).toEqual(expectedTokens);
  });

  it('should throw an error when encountering unexpected character', () => {
    const html = '<div>>';

    expect(() => tokenizeHTML(html)).toThrowError(
      'Unexpected character found while parsing: >'
    );
  });

  it('should handle incomplete html tag', () => {
    const html = '<div>hello world';
    const expectedTokens = [
      { type: 'tag', value: 'div', index: { string: 5 } },
      { type: 'text', value: 'hello world', index: { string: 16 } },
    ];

    const tokens = tokenizeHTML(html);

    expect(tokens).toEqual(expectedTokens);
  });

  it('should handle attributes with values', () => {
    const html = '<img src="example.jpg" alt="example" />';
    const expectedTokens = [
      { type: 'tag', value: 'img', index: { string: 5 } },
      { type: 'attr', value: 'src', index: { string: 9 } },
      { type: 'equal', value: '=', index: { string: 9 } },
      { type: 'value', value: 'example.jpg', index: { string: 22 } },
      { type: 'attr', value: 'alt', index: { string: 27 } },
      { type: 'equal', value: '=', index: { string: 27 } },
      { type: 'value', value: 'example', index: { string: 36 } },
      { type: 'tag_end', value: '', index: { string: 39 } },
    ];

    const tokens = tokenizeHTML(html);

    expect(tokens).toEqual(expectedTokens);
  });

  test('Empty string should return an empty array', () => {
    const result = tokenizeHTML('');
    expect(result).toEqual([]);
  });

  test('Parsing HTML tag with only start tag', () => {
    const result = tokenizeHTML('<html>');
    expect(result).toEqual([
      { type: 'tag', value: 'html', index: { string: 6 } },
    ]);
  });

  test('Parsing HTML tag with only end tag', () => {
    const result = tokenizeHTML('</html>');
    expect(result).toEqual([
      { type: 'tag_end', value: 'html', index: { string: 7 } },
    ]);
  });

  test('Parsing nested HTML tags', () => {
    const result = tokenizeHTML('<div><p>hello</p></div>');
    expect(result).toEqual([
      { type: 'tag', value: 'div', index: { string: 5 } },
      { type: 'tag', value: 'p', index: { string: 8 } },
      { type: 'text', value: 'hello', index: { string: 14 } },
      { type: 'tag_end', value: 'p', index: { string: 17 } },
      { type: 'tag_end', value: 'div', index: { string: 23 } },
    ]);
  });

  test('Parsing HTML tag without attributes', () => {
    const result = tokenizeHTML('<img>');
    expect(result).toEqual([
      { type: 'tag', value: 'img', index: { string: 5 } },
    ]);
  });

  test('Parsing HTML tag with multiple attributes', () => {
    const result = tokenizeHTML(
      '<a href="https://www.example.com" target="_blank">'
    );
    expect(result).toEqual([
      { type: 'tag', value: 'a', index: { string: 3 } },
      { type: 'attr', value: 'href', index: { string: 8 } },
      { type: 'equal', value: '=', index: { string: 8 } },
      {
        type: 'value',
        value: 'https://www.example.com',
        index: { string: 33 },
      },
      { type: 'attr', value: 'target', index: { string: 41 } },
      { type: 'equal', value: '=', index: { string: 41 } },
      { type: 'value', value: '_blank', index: { string: 49 } },
    ]);
  });

  test('Parsing HTML tag with line breaks and spaces', () => {
    const result = tokenizeHTML(`
      <div
        class="container"
        data-id="1"
      >
        <p>Hello world!</p>
      </div>
    `);
    expect(removeIndex(result)).toEqual([
      { type: 'text', value: `\n${'  '.repeat(3)}` },
      { type: 'tag', value: 'div' },
      { type: 'attr', value: 'class' },
      { type: 'equal', value: '=' },
      { type: 'value', value: 'container' },
      { type: 'attr', value: 'data-id' },
      { type: 'equal', value: '=' },
      { type: 'value', value: '1' },
      { type: 'text', value: `\n${'  '.repeat(4)}` },
      { type: 'tag', value: 'p' },
      { type: 'text', value: 'Hello world!' },
      { type: 'tag_end', value: 'p' },
      { type: 'text', value: `\n${'  '.repeat(3)}` },
      { type: 'tag_end', value: 'div' },
      { type: 'text', value: `\n${'  '.repeat(2)}` },
    ]);
  });
});

describe('tokenizeHTMLTemplate', () => {
  it('should handle plain text only', () => {
    const result = tokenizeHTMLTemplate`Hello, World!`;
    expect(result).toEqual([
      {
        type: 'text',
        value: 'Hello, World!',
        index: {
          string: 13,
          strings: 0,
        },
      },
    ]);
  });

  it('should handle a single HTML tag', () => {
    const result = tokenizeHTMLTemplate`<div></div>`;
    expect(result).toEqual([
      { type: 'tag', value: 'div', index: { string: 5, strings: 0 } },
      { type: 'tag_end', value: 'div', index: { string: 11, strings: 0 } },
    ]);
  });

  it('should handle an HTML tag with attributes', () => {
    const result = tokenizeHTMLTemplate`<a href="/link" target="_blank">Link</a>`;
    expect(result).toEqual([
      { type: 'tag', value: 'a', index: { string: 3, strings: 0 } },
      { type: 'attr', value: 'href', index: { string: 8, strings: 0 } },
      { type: 'equal', value: '=', index: { string: 8, strings: 0 } },
      { type: 'value', value: '/link', index: { string: 15, strings: 0 } },
      { type: 'attr', value: 'target', index: { string: 23, strings: 0 } },
      { type: 'equal', value: '=', index: { string: 23, strings: 0 } },
      { type: 'value', value: '_blank', index: { string: 31, strings: 0 } },
      { type: 'text', value: 'Link', index: { string: 37, strings: 0 } },
      { type: 'tag_end', value: 'a', index: { string: 40, strings: 0 } },
    ]);
  });

  it('should handle a mix of HTML tags and plain text', () => {
    const result = tokenizeHTMLTemplate`<h1>Hello, ${'World'}!</h1>`;
    expect(result).toEqual([
      { type: 'tag', value: 'h1', index: { string: 4, strings: 0 } },
      { type: 'text', value: 'Hello, ', index: { string: 11, strings: 0 } },
      { type: 'text', value: 'World', index: { value: 0 } },
      { type: 'text', value: '!', index: { string: 2, strings: 1 } },
      { type: 'tag_end', value: 'h1', index: { string: 6, strings: 1 } },
    ]);
  });
  it('should handle nested HTML tags', () => {
    const result = tokenizeHTMLTemplate`
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
      </div>
    `;
    expect(removeIndex(result)).toEqual([
      { type: 'text', value: '\n      ' },
      { type: 'tag', value: 'div' },
      { type: 'text', value: '\n        ' },
      { type: 'tag', value: 'h1' },
      { type: 'text', value: 'Title' },
      { type: 'tag_end', value: 'h1' },
      { type: 'text', value: '\n        ' },
      { type: 'tag', value: 'p' },
      { type: 'text', value: 'Paragraph' },
      { type: 'tag_end', value: 'p' },
      { type: 'text', value: '\n      ' },
      { type: 'tag_end', value: 'div' },
      { type: 'text', value: '\n    ' },
    ]);
  });

  it('should handle a mix of HTML tags and plain text with multiple template strings', () => {
    const result = tokenizeHTMLTemplate`
    <h1>${'Hello,'}</h1>
    <p>${'World!'}</p>
    `;
    expect(removeIndex(result)).toEqual([
      { type: 'text', value: '\n    ' },
      { type: 'tag', value: 'h1' },
      { type: 'text', value: 'Hello,' },
      { type: 'tag_end', value: 'h1' },
      { type: 'text', value: '\n    ' },
      { type: 'tag', value: 'p' },
      { type: 'text', value: 'World!' },
      { type: 'tag_end', value: 'p' },
      { type: 'text', value: '\n    ' },
    ]);
  });

  it('should throw an error for invalid characters in assignment', () => {
    expect(
      () => tokenizeHTMLTemplate`<a href=javascript:alert('hello')>Link</a>`
    ).toThrowError(`Unexpected character found while parsing: j`);
  });

  it('should throw an error for unexpected character while parsing', () => {
    expect(() => tokenizeHTMLTemplate`<div>>`).toThrowError(
      `Unexpected character found while parsing: >`
    );
  });

  it('not should throw for unexpected close token, and tokenize it', () => {
    const result = tokenizeHTMLTemplate`<div>${'Hello,'}</span>`;
    expect(result).toEqual([
      { type: 'tag', value: 'div', index: { string: 5, strings: 0 } },
      { type: 'text', value: 'Hello,', index: { value: 0 } },
      { type: 'tag_end', value: 'span', index: { string: 7, strings: 1 } },
    ]);
  });

  it('should tokenize attribute with function value', () => {
    const onClick = () => console.log('click');
    const result = tokenizeHTMLTemplate`<div onclick=${onClick}></div>`;
    expect(result).toEqual([
      { type: 'tag', value: 'div', index: { string: 5, strings: 0 } },
      { type: 'attr', value: 'onclick', index: { string: 13, strings: 0 } },
      { type: 'equal', value: '=', index: { string: 13, strings: 0 } },
      { type: 'value', value: onClick, index: { value: 0 } },
      { type: 'tag_end', value: 'div', index: { string: 7, strings: 1 } },
    ]);
  });

  it('should tokenize attribute with string value', () => {
    const result = tokenizeHTMLTemplate`<div class="my-class"></div>`;
    expect(result).toEqual([
      { type: 'tag', value: 'div', index: { string: 5, strings: 0 } },
      { type: 'attr', value: 'class', index: { string: 11, strings: 0 } },
      { type: 'equal', value: '=', index: { string: 11, strings: 0 } },
      { type: 'value', value: 'my-class', index: { string: 21, strings: 0 } },
      { type: 'tag_end', value: 'div', index: { string: 28, strings: 0 } },
    ]);
  });

  it('should throw an error when trying to insert unquoted attribute value', () => {
    expect(() => {
      tokenizeHTMLTemplate`<div class=my-class></div>`;
    }).toThrowError(Error);
  });

  it('should tokenize tag with slot value', () => {
    const AComponent = () => {};
    const result = tokenizeHTMLTemplate`<${AComponent}><//>`;
    expect(result).toEqual([
      { type: 'tag', value: AComponent, index: { value: 0 } },
      { type: 'tag_end', value: '/', index: { string: 5, strings: 1 } },
    ]);
  });

  it('should tokenize tag with slot value, and self close', () => {
    const AComponent = () => {};
    const result = tokenizeHTMLTemplate`<${AComponent} />`;
    expect(result).toEqual([
      { type: 'tag', value: AComponent, index: { value: 0 } },
      { type: 'tag_end', value: '', index: { string: 3, strings: 1 } },
    ]);
  });

  it('should tokenize tag with attributes', () => {
    const AComponent = () => {};
    const id = 'my-id';
    const result = tokenizeHTMLTemplate`<${AComponent} id="${id}" />`;
    expect(removeIndex(result)).toEqual([
      { type: 'tag', value: AComponent },
      { type: 'attr', value: 'id' },
      { type: 'equal', value: '=' },
      { type: 'value', value: id },
      { type: 'tag_end', value: '' },
    ]);
  });

  it('should tokenize tag with attributes, with incomplete tag', () => {
    const AComponent = () => {};
    const id = 'my-id';
    const result = tokenizeHTMLTemplate`<${AComponent} id="${id}">`;
    expect(removeIndex(result)).toEqual([
      { type: 'tag', value: AComponent },
      { type: 'attr', value: 'id' },
      { type: 'equal', value: '=' },
      { type: 'value', value: id },
    ]);
  });

  it('should tokenize tag with nested tags and text', () => {
    const AComponent = () => {};
    const BComponent = () => {};
    const result = tokenizeHTMLTemplate`
      <${AComponent}>
        <div>
          <p>${'Hello'}</p>
        </div>
        <${BComponent} />
      <//>
    `;
    expect(removeIndex(result, true)).toEqual(
      removeIndex(
        [
          { type: 'text', value: '\n    ', index: { string: 6, strings: 0 } },
          { type: 'tag', value: AComponent, index: { value: 0 } },
          { type: 'text', value: '\n      ', index: { string: 9, strings: 1 } },
          { type: 'tag', value: 'div', index: { string: 13, strings: 1 } },
          {
            type: 'text',
            value: '\n        ',
            index: { string: 23, strings: 1 },
          },
          { type: 'tag', value: 'p', index: { string: 25, strings: 1 } },
          { type: 'text', value: 'Hello', index: { value: 1 } },
          { type: 'tag_end', value: 'p', index: { string: 4, strings: 2 } },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 12, strings: 2 },
          },
          { type: 'tag_end', value: 'div', index: { string: 17, strings: 2 } },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 25, strings: 2 },
          },
          { type: 'tag', value: BComponent, index: { value: 2 } },
          { type: 'tag_end', value: '', index: { string: 3, strings: 3 } },
          { type: 'text', value: '\n    ', index: { string: 9, strings: 3 } },
          { type: 'tag_end', value: '/', index: { string: 12, strings: 3 } },
          { type: 'text', value: '\n  ', index: { string: 15, strings: 3 } },
        ],
        true
      )
    );
  });

  it('should throw error when encountering unexpected characters in assignment', () => {
    const input = `<div id=123>Hello World</div>`;
    expect(() => tokenizeHTML(input)).toThrow(
      new Error(`Unexpected character found while parsing: 1`)
    );
  });

  it('should ignore html comment', () => {
    const result = tokenizeHTMLTemplate`
      <div class="main">
        <!-- This is a comment -->
        <h1>Welcome to my website!</h1>
        <p>This is a paragraph.</p>
      </div>
    `;
    expect(removeIndex(result, true)).toEqual(
      removeIndex(
        [
          { type: 'text', value: '\n    ', index: { string: 6, strings: 0 } },
          { type: 'tag', value: 'div', index: { string: 10, strings: 0 } },
          { type: 'attr', value: 'class', index: { string: 16, strings: 0 } },
          { type: 'equal', value: '=', index: { string: 16, strings: 0 } },
          { type: 'value', value: 'main', index: { string: 22, strings: 0 } },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 31, strings: 0 },
          },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 64, strings: 0 },
          },
          { type: 'tag', value: 'h1', index: { string: 67, strings: 0 } },
          {
            type: 'text',
            value: 'Welcome to my website!',
            index: { string: 90, strings: 0 },
          },
          { type: 'tag_end', value: 'h1', index: { string: 94, strings: 0 } },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 102, strings: 0 },
          },
          { type: 'tag', value: 'p', index: { string: 104, strings: 0 } },
          {
            type: 'text',
            value: 'This is a paragraph.',
            index: { string: 125, strings: 0 },
          },
          { type: 'tag_end', value: 'p', index: { string: 128, strings: 0 } },
          { type: 'text', value: '\n    ', index: { string: 134, strings: 0 } },
          { type: 'tag_end', value: 'div', index: { string: 139, strings: 0 } },
          { type: 'text', value: '\n  ', index: { string: 142, strings: 0 } },
        ],
        true
      )
    );
  });

  it('should ignore html comment, with incomplete comment', () => {
    const result = tokenizeHTMLTemplate`
      <div class="main">
        <!-- This is a comment
        <h1>Welcome to my website!</h1>
        <p>This is a paragraph.</p>
      </div>
    `;
    expect(removeIndex(result, true)).toEqual(
      removeIndex(
        [
          { type: 'text', value: '\n    ', index: { string: 6, strings: 0 } },
          { type: 'tag', value: 'div', index: { string: 10, strings: 0 } },
          { type: 'attr', value: 'class', index: { string: 16, strings: 0 } },
          { type: 'equal', value: '=', index: { string: 16, strings: 0 } },
          { type: 'value', value: 'main', index: { string: 22, strings: 0 } },
          {
            type: 'text',
            value: '\n      ',
            index: { string: 31, strings: 0 },
          },
        ],
        true
      )
    );
  });

  it('should throw a error, with error comment start', () => {
    expect(
      () => tokenizeHTMLTemplate`
    <div class="main">
      <!!-- This is a comment -->
      <h1>Welcome to my website!</h1>
      <p>This is a paragraph.</p>
    </div>
  `
    ).toThrowError(`Unexpected character found while parsing: !`);
  });

  it('should parse no value attribute to boolean value', () => {
    const result = tokenizeHTMLTemplate`<button disabled>`;
    expect(removeIndex(result)).toEqual([
      { type: 'tag', value: 'button' },
      { type: 'attr', value: 'disabled' },
      { type: 'equal', value: '=' },
      { type: 'value', value: true },
    ]);
  });
});
