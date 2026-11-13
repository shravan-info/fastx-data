(function () {
  let skipPush = false;

  const origSearch = window.executeSearch;
  const origAI = window.openAIMode;
  const origSwitch = window.switchScreen;

  function safePush(state, url) {
    try {
      if (window.location.search !== url && (url !== window.location.pathname || window.location.search)) {
        history.pushState(state, "", url);
      }
    } catch (_) {}
  }

  // १) Normal Search करताना URL मध्ये ?q=india जोडणे
  if (typeof origSearch === "function") {
    window.executeSearch = async function (q, lang) {
      if (!skipPush && q && q.trim()) {
        safePush({ q: q.trim(), mode: "search" }, "?q=" + encodeURIComponent(q.trim()));
      }
      return origSearch.apply(this, arguments);
    };
  }

  // २) AI Mode मध्ये ?q=india&mode=ai जोडणे
  if (typeof origAI === "function") {
    window.openAIMode = async function (q) {
      if (!skipPush && q && q.trim()) {
        safePush({ q: q.trim(), mode: "ai" }, "?q=" + encodeURIComponent(q.trim()) + "&mode=ai");
      }
      return origAI.apply(this, arguments);
    };
  }

  // ३) Home वर गेल्यावर URL परत स्वच्छ करणे
  if (typeof origSwitch === "function") {
    window.switchScreen = function (name) {
      if (name === "home" && !skipPush && window.location.search) {
        safePush({ mode: "home" }, window.location.pathname);
      }
      return origSwitch.apply(this, arguments);
    };
  }

  // ४) URL मधून ?q=... वाचून आपोआप सर्च सुरू करणे
  function runFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const mode = params.get("mode");
    skipPush = true;
    try {
      if (q && q.trim()) {
        if (mode === "ai" && typeof window.openAIMode === "function") {
          window.openAIMode(q.trim());
        } else if (typeof window.executeSearch === "function") {
          window.executeSearch(q.trim());
        }
      } else if (typeof window.switchScreen === "function") {
        window.switchScreen("home");
      }
    } finally {
      skipPush = false;
    }
  }

  // ५) फोनचे Back बटन दाबल्यावर नीट मागे येण्यासाठी
  window.addEventListener("popstate", runFromUrl);

  // पेज उघडताच जर URL मध्ये ?q=... असेल तर लगेच सर्च कर
  if (new URLSearchParams(window.location.search).get("q")) {
    runFromUrl();
  }
})();
