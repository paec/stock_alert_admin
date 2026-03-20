const { createApp } = Vue;

createApp({
  data() {
    return {
      rules: [],
    };
  },

  mounted() {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        this.rules = Array.isArray(data.rules) ? data.rules : [];
      })
      .catch((err) => {
        console.error("Load config failed", err);
      });
  },

  methods: {
    addRule() {
      this.rules.push({ symbol: "", x_days: 3, y_percent: 5 });
    },

    save() {
      fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rules: this.rules,
        }),
      })
        .then((r) => {
          if (!r.ok) {
            throw new Error("Save failed");
          }
          alert("Saved");
        })
        .catch((err) => {
          console.error(err);
          alert("Save failed");
        });
    },
  },
}).mount("#app");
