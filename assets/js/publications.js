fetch("publications.bib")
  .then(res => res.text())
  .then(text => {
    const entries = bibtexParse.toJSON(text);
    renderPublications(entries);
  });

function renderPublications(entries) {
  const container = document.getElementById("pub-list");

  entries
    .sort((a, b) => b.entryTags.year - a.entryTags.year)
    .forEach(entry => {
      const t = entry.entryTags;

      const div = document.createElement("div");
      div.className = "publication";

      div.innerHTML = `
        <img class="pub-cover"
             src="assets/images/journals/${journalSlug(t.journal)}.jpg"
             alt="${t.journal} cover"
             onerror="
                this.onerror=null;
                this.src='assets/images/journals/${journalSlug(t.journal)}.jpeg';
                this.onerror=function(){
                  this.src='assets/images/journals/default.jpg';
                };
              ">

        <div class="pub-info">
          <h3 class="pub-title">${t.title}</h3>
          <p class="pub-authors">${formatAuthors(t.author)}</p>
          <p class="pub-journal">
            <em>${t.journal}</em> (${t.year})
          </p>
          <p class="pub-links">
            ${t.doi ? `<a href="https://doi.org/${t.doi}" target="_blank" rel="noopener noreferrer">DOI</a>` : ""}
            <!-- ${t.url ? ` · <a href="${t.url}">Link</a>` : ""} -->
          </p>
        </div>
      `;

      container.appendChild(div);
    });
}

function formatAuthors(authors) {
  return authors
    .replace(/ and /g, ", ")
    .replace("Your Name", "<strong>Your Name</strong>");
}

function journalSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
}