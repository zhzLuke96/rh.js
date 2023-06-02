// source here: https://gist.github.com/dr-dimitru/9317130
const regexp =
  /([^\S ]\s*| \s{2,})(?=[^<]*(?:<(?!\/?(?:textarea|pre|script)\b)[^<]*)*(?:<(textarea|pre|script)\b| \z))/g;

// (             # Match all whitespans other than single space.
// [^\S ]\s*     # Either one [\t\r\n\f\v] and zero or more ws,
// | \s{2,}        # or two or more consecutive-any-whitespace.
// ) # Note: The remaining regex consumes no text at all...
// (?=             # Ensure we are not in a blacklist tag.
// [^<]*        # Either zero or more non-"<" {normal*}
// (?:           # Begin {(special normal*)*} construct
// <           # or a < starting a non-blacklist tag.
// (?!\/?(?:textarea|pre|script)\b)
// [^<]*      # more non-"<" {normal*}
// )*           # Finish "unrolling-the-loop"
// (?:           # Begin alternation group.
// <           # Either a blacklist start tag.
// (textarea|pre|script)\b
//   | \z          # or end of file.
// )             # End alternation group.
// )  # If we made it here, we are not in a blacklist tag.

export const minifyHTML = (html: string) => html.replace(regexp, ' ');
