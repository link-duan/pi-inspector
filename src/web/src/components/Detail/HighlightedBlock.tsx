import React, { useMemo } from "react";
import {
	highlightContent,
	highlightJson,
	highlightBash,
	highlightMarkdownAndXml,
	highlightSearchInHtml,
	escapeHtml,
} from "../../utils/highlighter.ts";

export interface HighlightedTextBlockProps {
	text: string;
	syntaxHighlight?: boolean;
	searchQuery?: string;
	className?: string;
}

export const HighlightedTextBlock: React.FC<HighlightedTextBlockProps> = ({
	text,
	syntaxHighlight = true,
	searchQuery = "",
	className = "detail-text-block",
}) => {
	const html = useMemo(() => {
		if (!text) return "";
		if (!syntaxHighlight) {
			const escaped = escapeHtml(text);
			return searchQuery ? highlightSearchInHtml(escaped, searchQuery) : escaped;
		}
		const highlighted = highlightContent(text);
		return searchQuery ? highlightSearchInHtml(highlighted, searchQuery) : highlighted;
	}, [text, syntaxHighlight, searchQuery]);

	return (
		<div
			className={`${className} ${syntaxHighlight ? "hljs" : ""}`}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};

export interface HighlightedCodeBlockProps {
	code: string;
	language?: "json" | "bash" | "prompt" | "auto";
	syntaxHighlight?: boolean;
	searchQuery?: string;
	className?: string;
	emptyFallback?: string;
}

export const HighlightedCodeBlock: React.FC<HighlightedCodeBlockProps> = ({
	code,
	language = "auto",
	syntaxHighlight = true,
	searchQuery = "",
	className = "code-block mono",
	emptyFallback = "",
}) => {
	const html = useMemo(() => {
		const target = code || emptyFallback;
		if (!target) return "";
		if (!code && emptyFallback) {
			return escapeHtml(emptyFallback);
		}
		if (!syntaxHighlight) {
			const escaped = escapeHtml(code);
			return searchQuery ? highlightSearchInHtml(escaped, searchQuery) : escaped;
		}
		let highlighted = "";
		if (language === "json") {
			highlighted = highlightJson(code);
		} else if (language === "bash") {
			highlighted = highlightBash(code);
		} else if (language === "prompt") {
			highlighted = highlightMarkdownAndXml(code);
		} else {
			highlighted = highlightContent(code);
		}
		return searchQuery ? highlightSearchInHtml(highlighted, searchQuery) : highlighted;
	}, [code, language, syntaxHighlight, searchQuery, emptyFallback]);

	return (
		<pre
			className={`${className} ${syntaxHighlight ? "hljs" : ""}`}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
