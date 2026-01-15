import { jsx, jsxs } from 'react/jsx-runtime';

const e = { container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: "1rem" }, content: { textAlign: "center", padding: "2rem", maxWidth: "500px" }, title: { fontSize: "2.5rem", fontWeight: 700, color: "#1a1a2e", margin: 0, marginBottom: "0.5rem" }, subtitle: { fontSize: "1.25rem", color: "#6c757d", margin: 0, marginBottom: "2rem" }, message: { fontSize: "1rem", color: "#495057", lineHeight: 1.6 } }, r = function() {
  return jsx("div", { style: e.container, children: jsxs("div", { style: e.content, children: [jsx("h1", { style: e.title, children: "Little Journey" }), jsx("p", { style: e.subtitle, children: "Family Memory Sharing" }), jsxs("p", { style: e.message, children: ["This viewer is for family members with a magic link.", jsx("br", {}), "Please use the link sent to your email to view memories."] })] }) });
};

export { r as component };
//# sourceMappingURL=index-CQjyKwuU.mjs.map
