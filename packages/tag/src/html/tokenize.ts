export type HTMLTemplateToken = {
  type:
    | "text"
    | "tag_start"
    | "close_start"
    | "end"
    | "tag"
    | "tag_end"
    | "attr"
    | "value"
    | "equal";
  value: any;

  index: {
    string?: number;
    strings?: number;
    value?: number;
  };
};
type TokenizerState =
  | "text"
  | "tag_start"
  | "close_start"
  | "tag"
  | "value"
  | "assignment"
  | "value_done"
  | "comment"
  | "attribute";

// Parse incomplete html and get tokens
export function tokenizeHTML(
  html: string,
  init_state = "text" as TokenizerState
) {
  const tokens = [] as HTMLTemplateToken[];

  // Traverse html characters, lexical analysis, parse into tokens, tokens have different types
  let state = init_state; // Define a state variable to record the current parsing type, initially text type
  let buffer = ""; // Define a buffer variable to store the current parsed characters

  let index = 0;
  const pushToken = (
    type: HTMLTemplateToken["type"],
    value = buffer as any
  ) => {
    tokens.push({
      type,
      value,
      index: {
        string: index,
      },
    });
    buffer = "";
  };
  const transform = (s: TokenizerState) => (state = s);
  const consumeChar = () => {
    const char = html[index];
    index += 1;
    return char;
  };
  while (index < html.length) {
    const char = consumeChar();
    const throwError = (): never => {
      throw new Error(`Unexpected character found while parsing: ${char}`);
    };
    // Traverse each character
    switch (
      state // Perform different processing according to the state
    ) {
      case "text": // If it is text type
        if (char === "<") {
          // If you encounter a left angle bracket
          if (buffer) {
            // If the buffer variable is not empty
            pushToken("text"); // Add the buffer variable as a text type token to the array
            buffer = ""; // Empty the buffer variable
          }
          pushToken("tag_start", "<");
          transform("tag_start");
        } else if (char === ">") {
          throwError();
        } else {
          // If you don't encounter a left angle bracket
          buffer += char; // Add the character to the buffer variable
        }
        break;
      case "tag_start":
        if (char === "/") {
          tokens.pop();
          pushToken("close_start", "</");
          transform("close_start");
        } else if (char === "!") {
          tokens.pop();
          if (consumeChar() === "-" && consumeChar() === "-") {
            transform("comment");
          } else {
            throwError();
          }
        } else {
          tokens.pop();
          transform("tag");
          buffer += char; // Add the character to the buffer variable
        }
        break;
      case "comment":
        if (char === "-") {
          const next3 = [char, consumeChar(), consumeChar()].join("");
          if (next3 === "-->") {
            transform("text");
          }
        }
        // drop all comment characters
        break;
      case "close_start":
        if (char === ">") {
          tokens.pop();
          pushToken("tag_end", buffer);
          buffer = "";
          transform("text");
        } else if (char !== " " && char !== "\n" && char !== "\t") {
          // ignore whitespace characters
          buffer += char;
        }
        break;
      case "value_done":
        switch (char) {
          case "\n":
          case " ":
          case '"':
            transform("attribute");
            break;
          case "/":
            transform("close_start");
            break;
          case ">":
            transform("text");
            break;
          default:
            throwError();
        }
        break;
      case "tag": // If it is tag type
        switch (
          char // Perform different processing according to the character
        ) {
          case ">": // If you encounter a right angle bracket
            if (buffer.trim()) {
              pushToken("tag", buffer.trim());
              buffer = ""; // Empty the buffer variable
            }
            transform("text");
            break;
          case '"':
          case "=":
            throwError();
            break;
          case "\n":
          case " ": // If you encounter a space
            if (buffer.trim()) {
              // If the buffer variable is not empty
              pushToken("tag", buffer.trim());
            }
            transform("attribute");
            buffer = ""; // Empty the buffer variable
            break;
          case "/": {
            buffer = "";
            pushToken("close_start", "</");
            transform("close_start");
            break;
          }
          default: // If it is other characters
            buffer += char; // Add the character to the buffer variable
        }
        break;
      case "attribute":
        switch (
          char // Perform different processing according to the character
        ) {
          case ">": // If you encounter a right angle bracket
            if (buffer.trim()) {
              pushToken("attr", buffer.trim());
              pushToken("equal", "=");
              pushToken("value", true);
              buffer = ""; // Empty the buffer variable
            }
            transform("text");
            break;
          case "=": // If you encounter an equal sign
            if (buffer.trim()) {
              // If the buffer variable is not empty
              pushToken("attr", buffer.trim()); // Add the buffer variable as an attribute name type token to the array
            } else {
              throwError();
            }
            pushToken("equal", char); // Add the equal sign as an equal type token to the array
            buffer = ""; // Empty the buffer variable
            transform("assignment");
            break;
          case '"':
            throwError();
            break;
          case " ": // If you encounter a space
            if (buffer.trim()) {
              pushToken("attr", buffer.trim());
              pushToken("equal", "=");
              pushToken("value", true);
            }
            buffer = ""; // Empty the buffer variable
            break;
          case "/": {
            buffer = "";
            pushToken("close_start", "</");
            transform("close_start");
            break;
          }
          default: // If it is other characters
            buffer += char; // Add the character to the buffer variable
        }
        break;
      case "assignment": // If it is assignment type
        if (char === '"') {
          transform("value"); // Change the state to attribute value type
          buffer = "";
        } else {
          throwError();
        }
        break;
      case "value": // If it is attribute value type
        if (char === '"') {
          // If you encounter a double quote
          pushToken("value", buffer); // Add the buffer variable as an attribute value type token to the array
          buffer = ""; // Empty the buffer variable
          transform("tag");
        } else {
          // If it is other characters
          buffer += char; // Add the character to the buffer variable
        }
        break;
    }
  }
  if (buffer) {
    pushToken("text", buffer);
  }
  return [tokens, state] as const;
}

export const tokenizeHTMLTemplate = (
  strings: TemplateStringsArray,
  ...values: any[]
) => {
  const all_tokens = [] as HTMLTemplateToken[];
  let state = "text" as TokenizerState;

  const append_value = (value: any, index: number) => {
    all_tokens.push({
      type: "value",
      value,
      index: {
        value: index,
      },
    });
    state = "value_done";
  };
  const append_tag = (value: any, index: number) => {
    all_tokens.push({
      type: "tag",
      value,
      index: {
        value: index,
      },
    });
    state = "attribute";
  };
  const append_text = (value: any, index: number) => {
    all_tokens.push({
      type: "text",
      value,
      index: {
        value: index,
      },
    });
    state = "text";
  };

  for (let idx = 0; idx < strings.length; idx++) {
    const string = strings[idx];
    const value = values[idx];
    let tokens = [] as HTMLTemplateToken[];
    [tokens, state] = tokenizeHTML(string, state);

    if (tokens.length !== 0) {
      all_tokens.push(
        ...tokens.map((x) => ({
          ...x,
          index: {
            ...x.index,
            strings: idx,
          },
        }))
      );
    }

    if (!value) {
      continue;
    }

    const tailToken = tokens[tokens.length - 1];
    if (!tailToken) {
      switch (state) {
        case "assignment":
          append_value(value, idx);
          break;
        case "tag_start": {
          append_tag(value, idx);
          break;
        }
        default: {
          append_text(value, idx);
          break;
        }
      }
      continue;
    }
    switch (tailToken.type) {
      case "equal": {
        append_value(value, idx);
        break;
      }
      case "tag_start": {
        all_tokens.pop(); // pop start token
        append_tag(value, idx);
        break;
      }
      case "value":
      case "tag":
      case "text": {
        append_text(value, idx);
        break;
      }
      default: {
        throw new Error(`Unexpected token`);
      }
    }
  }
  return all_tokens;
};
