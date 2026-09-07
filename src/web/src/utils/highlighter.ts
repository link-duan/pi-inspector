import hljs from "highlight.js/lib/core";
import markdown from "highlight.js/lib/languages/markdown";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import diff from "highlight.js/lib/languages/diff";

// Register base languages on the singleton instance
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("diff", diff);

/**
 * Custom prompt language:
 * System prompts heavily mix Markdown (headers, lists, fences) with XML (tags, skills, context).
 * Standard Markdown treats 4-space indentation as a code block, which swallows indented
 * XML tags (like <skill>, <name>, <location> in <available_skills>) into unhighlighted code.
 * Also, intra-word underscores in file paths (e.g. /node_modules/) can trigger unclosed italics.
 * This grammar fixes both so that all XML tags throughout the prompt (including the tail) are highlighted.
 */
function createPromptGrammar(hljsInstance: typeof hljs) {
	const md = markdown(hljsInstance);

	if (Array.isArray(md.contains)) {
		for (const item of md.contains) {
			if (item && typeof item === "object") {
				// 1. Remove 4-space indented code blocks so indented XML tags are preserved
				const codeRule = item as { className?: string; variants?: Array<{ begin?: unknown }> };
				if (codeRule.className === "code" && Array.isArray(codeRule.variants)) {
					codeRule.variants = codeRule.variants.filter((v) => !String(v.begin).includes(" {4}"));
				}

				// 2. Enhance XML recognition to support comments and CDATA
				const htmlRule = item as { subLanguage?: string; begin?: RegExp };
				if (htmlRule.subLanguage === "xml") {
					htmlRule.begin = /<\/?[A-Za-z_]|<!--|<!\[CDATA\[/;
				}

				// 3. Prevent intra-word underscores (e.g. in /node_modules/ or snake_case) from opening unclosed italics
				const emphasisRule = item as {
					className?: string;
					variants?: Array<{ begin?: RegExp; end?: RegExp }>;
				};
				if (emphasisRule.className === "emphasis" && Array.isArray(emphasisRule.variants)) {
					for (const v of emphasisRule.variants) {
						if (String(v.begin).includes("_")) {
							v.begin = /(?:\s|^)_(?!\s)/;
							v.end = /_(?:\s|$|[.,;:!?\n])|$/;
						}
					}
				}
			}
		}
	}

	return md;
}

hljs.registerLanguage("prompt", createPromptGrammar);

export { hljs };

/**
 * Escape basic HTML characters
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Syntax-highlight markdown with embedded XML tag support
 */
export function highlightMarkdownAndXml(text: string): string {
	if (!text) return "";
	try {
		return hljs.highlight(text, { language: "prompt", ignoreIllegals: true }).value;
	} catch {
		return escapeHtml(text);
	}
}

/**
 * Syntax-highlight JSON string safely
 */
export function highlightJson(text: string): string {
	if (!text) return "";
	try {
		return hljs.highlight(text, { language: "json", ignoreIllegals: true }).value;
	} catch {
		return escapeHtml(text);
	}
}

/**
 * Syntax-highlight Bash command safely
 */
export function highlightBash(text: string): string {
	if (!text) return "";
	try {
		return hljs.highlight(text, { language: "bash", ignoreIllegals: true }).value;
	} catch {
		return escapeHtml(text);
	}
}

/**
 * Auto-detect and syntax-highlight text content:
 * - Valid JSON object/array is highlighted with json grammar
 * - Unified diffs are highlighted with diff grammar
 * - Markdown and XML-like tags are highlighted with prompt grammar
 */
export function highlightContent(text: string): string {
	if (!text) return "";
	const trimmed = text.trim();

	// 1. JSON
	if (
		(trimmed.startsWith("{") && trimmed.endsWith("}")) ||
		(trimmed.startsWith("[") && trimmed.endsWith("]"))
	) {
		try {
			JSON.parse(trimmed);
			return hljs.highlight(text, { language: "json", ignoreIllegals: true }).value;
		} catch {
			// Not valid JSON, proceed
		}
	}

	// 2. Unified Diff
	if (
		(trimmed.startsWith("--- ") || trimmed.startsWith("diff --git ")) &&
		trimmed.includes("\n+++ ")
	) {
		try {
			return hljs.highlight(text, { language: "diff", ignoreIllegals: true }).value;
		} catch {
			// Proceed
		}
	}

	// 3. Mixed Markdown and XML
	return highlightMarkdownAndXml(text);
}

/**
 * Highlights search matches in an HTML string with <mark class="search-highlight">
 * without breaking existing HTML tags/attributes.
 */
export function highlightSearchInHtml(html: string, query: string): string {
	if (!query || !query.trim() || !html) return html;
	const q = query.trim();

	// Case 1: Search query does not contain tag delimiters (< or >)
	if (!q.includes("<") && !q.includes(">")) {
		const escaped = q
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(<[^>]+>)|(${escaped})`, "gi");
		return html.replace(regex, (m, tag, textMatch) => {
			if (tag) return tag;
			if (textMatch) return `<mark class="search-highlight">${textMatch}</mark>`;
			return m;
		});
	}

	// Case 2: Query contains < or >, meaning it may span across syntax tags
	const escapedTokens: string[] = [];
	for (let i = 0; i < q.length; i++) {
		const ch = q[i]!;
		if (ch === "<") escapedTokens.push("&lt;");
		else if (ch === ">") escapedTokens.push("&gt;");
		else if (ch === "&") escapedTokens.push("&amp;");
		else if (ch === '"') escapedTokens.push("&quot;");
		else escapedTokens.push(ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	}

	// Interleave tokens with optional HTML tags in between
	const pattern = escapedTokens.map((t) => `(?:${t})`).join("(?:<[^>]+>)*");
	const regex = new RegExp(pattern, "gi");

	return html.replace(regex, (matched) => {
		// Wrap only text outside of inner tags
		return matched.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => {
			if (tag) return tag;
			if (text) return `<mark class="search-highlight">${text}</mark>`;
			return m;
		});
	});
}
