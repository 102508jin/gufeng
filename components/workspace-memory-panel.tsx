import type { PersonaProfile } from "@/lib/types/persona";
import type { FavoriteAnswer, LocalWorkspaceProfile, QuestionHistoryEntry } from "@/lib/utils/workspace-memory";

type WorkspaceMemoryPanelProps = {
  profiles: LocalWorkspaceProfile[];
  activeProfileId: string;
  profileNameDraft: string;
  historyEntries: QuestionHistoryEntry[];
  favorites: FavoriteAnswer[];
  personas: PersonaProfile[];
  personaFilter: string;
  topicFilter: string;
  onProfileChange: (value: string) => void;
  onProfileNameDraftChange: (value: string) => void;
  onCreateProfile: () => void;
  onRenameProfile: () => void;
  onDeleteProfile: () => void;
  onExportProfileBackup: () => void;
  onImportProfileBackup: (file: File) => void;
  onPersonaFilterChange: (value: string) => void;
  onTopicFilterChange: (value: string) => void;
  onUseHistory: (entry: QuestionHistoryEntry) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
  onUseFavoriteQuery: (favorite: FavoriteAnswer) => void;
  onRemoveFavorite: (favoriteKey: string) => void;
  onExportFavorite: (favorite: FavoriteAnswer) => void;
};

const text = {
  eyebrow: "\u672c\u5730\u8bb0\u5fc6",
  title: "\u5386\u53f2\u4e0e\u6536\u85cf",
  profileTitle: "\u672c\u5730\u914d\u7f6e\u6863",
  profileName: "\u914d\u7f6e\u6863\u540d\u79f0",
  createProfile: "\u65b0\u5efa",
  renameProfile: "\u91cd\u547d\u540d",
  deleteProfile: "\u5220\u9664",
  exportProfile: "\u5907\u4efd",
  importProfile: "\u5bfc\u5165",
  historyTitle: "\u6700\u8fd1\u63d0\u95ee",
  favoriteTitle: "\u6536\u85cf\u7b54\u590d",
  emptyHistory: "\u6682\u65e0\u5386\u53f2\u3002",
  emptyFavorites: "\u6682\u65e0\u6536\u85cf\u3002",
  reuse: "\u590d\u7528",
  remove: "\u79fb\u9664",
  clear: "\u6e05\u7a7a",
  export: "\u5bfc\u51fa",
  allPersonas: "\u5168\u90e8\u89d2\u8272",
  topicPlaceholder: "\u4e3b\u9898\u6216\u5173\u952e\u8bcd",
  genericPersona: "\u901a\u7528",
  separator: "\u3001"
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function WorkspaceMemoryPanel(props: WorkspaceMemoryPanelProps) {
  return (
    <section className="panel memory-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
      </div>

      <section className="memory-section">
        <div className="memory-section-header">
          <h3>{text.profileTitle}</h3>
        </div>

        <div className="profile-grid">
          <select
            className="field-input field-select"
            value={props.activeProfileId}
            onChange={(event) => props.onProfileChange(event.target.value)}
          >
            {props.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <input
            className="field-input"
            value={props.profileNameDraft}
            onChange={(event) => props.onProfileNameDraftChange(event.target.value)}
            placeholder={text.profileName}
            maxLength={40}
          />
        </div>

        <div className="memory-actions">
          <button type="button" className="ghost-button" onClick={props.onCreateProfile}>
            {text.createProfile}
          </button>
          <button type="button" className="ghost-button" onClick={props.onRenameProfile}>
            {text.renameProfile}
          </button>
          <button type="button" className="ghost-button" onClick={props.onDeleteProfile}>
            {text.deleteProfile}
          </button>
          <button type="button" className="ghost-button" onClick={props.onExportProfileBackup}>
            {text.exportProfile}
          </button>
          <label className="ghost-button file-button">
            {text.importProfile}
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  props.onImportProfileBackup(file);
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="memory-section">
        <div className="memory-section-header">
          <h3>{text.historyTitle}</h3>
          {props.historyEntries.length ? (
            <button type="button" className="ghost-button" onClick={props.onClearHistory}>
              {text.clear}
            </button>
          ) : null}
        </div>

        {props.historyEntries.length ? (
          <div className="memory-list">
            {props.historyEntries.map((entry) => (
              <article key={entry.id} className="memory-item">
                <button type="button" className="memory-main" onClick={() => props.onUseHistory(entry)}>
                  <strong>{entry.normalizedQuery}</strong>
                  <span>
                    {formatDate(entry.createdAt)}
                    {" · "}
                    {entry.personaName ?? text.genericPersona}
                    {entry.topics.length ? ` · ${entry.topics.join(text.separator)}` : ""}
                  </span>
                </button>
                <button type="button" className="ghost-button" onClick={() => props.onRemoveHistory(entry.id)}>
                  {text.remove}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">{text.emptyHistory}</p>
        )}
      </section>

      <section className="memory-section">
        <div className="memory-section-header">
          <h3>{text.favoriteTitle}</h3>
        </div>

        <div className="memory-filter-grid">
          <select
            className="field-input field-select"
            value={props.personaFilter}
            onChange={(event) => props.onPersonaFilterChange(event.target.value)}
          >
            <option value="">{text.allPersonas}</option>
            {props.personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
          <input
            className="field-input"
            value={props.topicFilter}
            onChange={(event) => props.onTopicFilterChange(event.target.value)}
            placeholder={text.topicPlaceholder}
          />
        </div>

        {props.favorites.length ? (
          <div className="memory-list">
            {props.favorites.map((favorite) => (
              <article key={favorite.favoriteKey} className="memory-item memory-item-stacked">
                <button type="button" className="memory-main" onClick={() => props.onUseFavoriteQuery(favorite)}>
                  <strong>{favorite.variantTitle}</strong>
                  <span>
                    {favorite.personaName ?? text.genericPersona}
                    {favorite.topics.length ? ` · ${favorite.topics.join(text.separator)}` : ""}
                  </span>
                </button>
                <div className="memory-actions">
                  <button type="button" className="ghost-button" onClick={() => props.onExportFavorite(favorite)}>
                    {text.export}
                  </button>
                  <button type="button" className="ghost-button" onClick={() => props.onRemoveFavorite(favorite.favoriteKey)}>
                    {text.remove}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">{text.emptyFavorites}</p>
        )}
      </section>
    </section>
  );
}
