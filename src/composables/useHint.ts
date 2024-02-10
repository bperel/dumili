import {
  EntrySuggestion,
  IssueSuggestion,
  StoryversionKind,
  suggestions,
} from "~/stores/suggestions";
import CoverIdServices from "~dm-services/cover-id/types";
import { StorySearchResults } from "~dm-types/StorySearchResults";
import { KumikoResult } from "~dumili-types/KumikoResult";
import { EventReturnType } from "~socket.io-services/types";
import { stores as webStores } from "~web";

export default () => {
  const { acceptSuggestion } = suggestions();
  const {
    acceptedEntries,
    entrySuggestions,
    issueSuggestions,
    storyversionKindSuggestions,
  } = storeToRefs(suggestions());
  const coaStore = webStores.coa();
  const applyHintsFromKumiko = (results: KumikoResult[]) => {
    results?.forEach((result, idx) => {
      const entryurl = Object.keys(entrySuggestions.value)[idx];
      const shouldBeAccepted = acceptedEntries.value[entryurl] === undefined;

      if (shouldBeAccepted) {
        const inferredKind =
          result.panels.length === 1
            ? idx === 0
              ? StoryversionKind.Cover
              : StoryversionKind.Illustration
            : StoryversionKind.Story;
        acceptSuggestion(
          storyversionKindSuggestions.value[entryurl],
          ({ data }) => data.kind === inferredKind,
          { source: "ai", status: "success" },
          (suggestion) => (suggestion.data.panels = result.panels)
        );
      }
    });
  };

  const applyHintsFromCoverSearch = async (
    results: EventReturnType<CoverIdServices["searchFromCover"]>
  ) => {
    if (!results.covers?.length) {
      console.error("Erreur lors de la recherche par image de la couverture");
      return;
    }
    issueSuggestions.value = results.covers.map(
      ({ issuecode, publicationcode, issuenumber, id: coverId }) =>
        new IssueSuggestion(
          {
            issuecode,
            publicationcode,
            issuenumber,
            coverId,
          },
          {
            source: "ai",
            isAccepted: false,
            status: "success",
          }
        )
    );

    await coaStore.fetchPublicationNames(
      results.covers.map(({ publicationcode }) => publicationcode!)
    );
  };

  const applyHintsFromKeywordSearch = (
    entryurl: string,
    results: StorySearchResults["results"]
  ) => {
    const entryIndex = entrySuggestions.value.findIndex(
      ({ url }) => url === entryurl
    );
    // entrySuggestions.value[entryurl] = entrySuggestions.value[entryurl].filter(
    //   ({ meta }) => meta.source === "ai"
    // );
    entrySuggestions.value[entryIndex].suggestions = results.map(
      ({ storycode, title }) =>
        new EntrySuggestion(
          {
            storyversion: {
              storycode,
            },
            title,
          },
          {
            source: "ai",
            isAccepted: false,
            status: "success",
          }
        )
    );
  };

  return {
    applyHintsFromKumiko,
    applyHintsFromCoverSearch,
    applyHintsFromKeywordSearch,
  };
};
