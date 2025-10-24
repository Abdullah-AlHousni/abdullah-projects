import type { WikipediaSnippet } from "../types/factCheck";

const WIKI_SEARCH_ENDPOINT = "https://en.wikipedia.org/w/rest.php/v1/search/title";
const WIKI_SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary";

const MAX_RESULTS = 3;
const MAX_SNIPPET_LENGTH = 800;

const normalizeSnippet = (text: string) => {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > MAX_SNIPPET_LENGTH
    ? `${trimmed.slice(0, MAX_SNIPPET_LENGTH - 1)}…`
    : trimmed;
};

export const fetchEvidenceFromWikipedia = async (query: string): Promise<WikipediaSnippet[]> => {
  if (!query.trim()) {
    return [];
  }

  const searchUrl = `${WIKI_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&limit=5`;
  const searchResponse = await fetch(searchUrl, {
    headers: {
      "User-Agent": "ChirpFactCheck/1.0 (contact: support@chirp.example)",
    },
  });

  if (!searchResponse.ok) {
    throw new Error(`Wikipedia search failed with status ${searchResponse.status}`);
  }

  const searchJson = (await searchResponse.json()) as {
    pages?: Array<{ title: string }>;
  };

  const pages = searchJson.pages ?? [];
  if (pages.length === 0) {
    return [];
  }

  const topTitles = pages.slice(0, MAX_RESULTS).map((page) => page.title);

  const snippets: WikipediaSnippet[] = [];

  for (const title of topTitles) {
    try {
      const summaryUrl = `${WIKI_SUMMARY_ENDPOINT}/${encodeURIComponent(title)}`;
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          "User-Agent": "ChirpFactCheck/1.0 (contact: support@chirp.example)",
        },
      });

      if (!summaryResponse.ok) {
        continue;
      }

      const summaryJson = (await summaryResponse.json()) as {
        title?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      };

      const snippetText = summaryJson.extract?.trim();
      if (!snippetText) {
        continue;
      }

      const pageTitle = summaryJson.title ?? title;
      const url = summaryJson.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

      snippets.push({
        title: pageTitle,
        url,
        snippet: normalizeSnippet(snippetText),
      });
    } catch (error) {
      // Ignore individual summary failures to keep fact-check resilient.
      continue;
    }
  }

  return snippets;
};
