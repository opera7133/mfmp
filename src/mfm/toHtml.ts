import * as mfm from 'mfm-js';
import { JSDOM } from "jsdom"
import { intersperse } from '../utils/array';

export type mfmHTMLConf = {
  url?: string;
  animate?: boolean;
  codeTagAsDiv?: boolean;
  rootTagName?: boolean;
}

export function toHtml(tokens: mfm.MfmNode[], config: mfmHTMLConf = {}): string {
  function appendChildren(children: mfm.MfmNode[], targetElement: any): void {
    for (const child of children.map(t => handlers[t.type](t))) targetElement.appendChild(child);
  }

  if (tokens.length === 0) {
    return ""
  }

  const { window } = new JSDOM('');
  const doc = window.document;
  let bigcnt = 0, motcnt = 0;

  const handlers: { [key: string]: (token: mfm.MfmNode) => any } = {
    bold(token) {
      const el = doc.createElement('b');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'bold');
      return el;
    },

    big(token) {
      bigcnt++
      const el = doc.createElement('strong');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'big');
      if (config.animate && bigcnt <= 3) el.setAttribute('class', 'animated tada')
      return el;
    },

    small(token) {
      const el = doc.createElement('small');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'small');
      return el;
    },

    strike(token) {
      const el = doc.createElement('del');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'strike');
      return el;
    },

    italic(token) {
      const el = doc.createElement('i');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'i');
      return el;
    },

    motion(token) {
      motcnt++
      const el = doc.createElement('i');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'motion');
      if (config.animate && motcnt <= 3) el.setAttribute('class', 'animated rubberBand')
      return el;
    },

    spin(token) {
      const el = doc.createElement('i');
      el.setAttribute('data-mfm', 'spin');
      if (token.children) {
        appendChildren(token.children, el);
      }
      return el;
    },

    jump(token) {
      const el = doc.createElement('i');
      el.setAttribute('data-mfm', 'jump');
      if (token.children) {
        appendChildren(token.children, el);
      }
      return el;
    },

    flip(token) {
      const el = doc.createElement('span');
      el.setAttribute('data-mfm', 'flip');
      if (token.children) {
        appendChildren(token.children, el);
      }
      return el;
    },

    blockCode(token) {
      const pre = config.codeTagAsDiv ? doc.createElement('div') : doc.createElement('pre');
      const inner = config.codeTagAsDiv ? doc.createElement('div') : doc.createElement('code');
      if (token.type === "blockCode") {
        inner.innerHTML = token.props.code;
        inner.setAttribute('data-mfm', 'blockCode-inner');
        inner.classList.add(`language-${token.props.lang}`);
      }
      pre.appendChild(inner);
      pre.setAttribute('data-mfm', 'blockCode');
      return pre;
    },

    center(token) {
      const el = doc.createElement('div');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'center');
      return el;
    },

    emoji(token) {
      if (token.type === "emojiCode") {
        return doc.createTextNode(`:${token.props.name}:`);
      } else if (token.type === "unicodeEmoji") {
        return doc.createTextNode(token.props.emoji);
      }
    },

    hashtag(token) {
      const a = doc.createElement('a');
      if (token.type === "hashtag") {
        a.href = `${config.url || ''}/tags/${token.props.hashtag}`;
        a.textContent = `#${token.props.hashtag}`;
      }
      a.setAttribute('rel', 'tag');
      a.setAttribute('data-mfm', 'hashtag');
      return a;
    },

    inlineCode(token) {
      const el = config.codeTagAsDiv ? doc.createElement('span') : doc.createElement('code');
      if (token.type === "inlineCode") {
        el.textContent = token.props.code;
        el.setAttribute('data-mfm', 'inlineCode');
      }
      return el;
    },

    mathInline(token) {
      const el = doc.createElement('code');
      if (token.type === "mathInline") {
        el.textContent = token.props.formula
        el.setAttribute('data-mfm', 'mathInline');
      }
      return el;
    },

    mathBlock(token) {
      const el = doc.createElement('code');
      if (token.type === "mathBlock") {
        el.textContent = token.props.formula
        el.setAttribute('data-mfm', 'mathBlock');
      }
      return el;
    },

    link(token) {
      const a = doc.createElement('a');
      if (token.type === "url") {
        a.href = token.props?.url;
      }
      if (token.children) {
        appendChildren(token.children, a);
      }
      a.setAttribute('data-mfm', 'link');
      return a;
    },

    mention(token) {
      const a = doc.createElement('a');
      if (token.type === "mention") {
        const { username, host, acct } = token.props;
        switch (host) {
          case 'github.com':
            a.href = `https://github.com/${username}`;
            break;
          case 'twitter.com':
            a.href = `https://twitter.com/${username}`;
            break;
          default:
            a.href = host ? `https://${host}/{acct}` : `https://${config.url}/${acct}`;
            break;
        }
        a.textContent = acct;
        a.setAttribute('data-mfm', 'mention');
      }
      return a;
    },

    quote(token) {
      const el = doc.createElement('blockquote');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'quote');
      return el;
    },

    title(token) {
      const el = doc.createElement('h1');
      if (token.children) {
        appendChildren(token.children, el);
      }
      el.setAttribute('data-mfm', 'title');
      return el;
    },

    text(token) {
      const el = doc.createElement('span');
      if (token.type === "text") {
        const nodes = (token.props.text as string).split(/\r\n|\r|\n/).map(x => doc.createTextNode(x) as Node);
        for (const x of intersperse<Node | 'br'>('br', nodes)) {
          el.appendChild(x === 'br' ? doc.createElement('br') : x);
        }
        el.setAttribute('data-mfm', 'text');
      }
      return el;
    },

    url(token) {
      const a = doc.createElement('a');
      if (token.type === "url") {
        a.href = token.props.url;
        a.textContent = token.props.url;
      }
      a.setAttribute('data-mfm', 'url');
      return a;
    },

    search(token) {
      const a = doc.createElement('a');
      if (token.type === "search") {
        a.href = `https://www.google.com/search?q=${token.props.query}`;
        a.textContent = token.props?.content;
      }
      return a;
    }
  };
  appendChildren(tokens, doc.body)

  const ttag = config.rootTagName || 'p'

  return `<${ttag} data-mfm="root">${doc.body.innerHTML}</${ttag}>`;
}