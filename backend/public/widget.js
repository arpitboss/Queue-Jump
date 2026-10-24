/**
 * QueueJump Drop-in Embeddable Waitlist Widget
 * Zero dependencies, Shadow DOM encapsulation, automatic ?ref= attribution.
 */
(function () {
  "use strict";

  function initQueueJumpWidget() {
    const containers = document.querySelectorAll("[data-queuejump], #queuejump");
    if (containers.length === 0) return;

    containers.forEach((container) => {
      if (container.dataset.initialized) return;
      container.dataset.initialized = "true";

      const scriptSrc = document.currentScript ? document.currentScript.src : "";
      let scriptOrigin = "";
      try {
        if (scriptSrc) scriptOrigin = new URL(scriptSrc).origin;
      } catch (e) {}

      const publicKey =
        container.getAttribute("data-key") ||
        document.currentScript?.getAttribute("data-key") ||
        window.QUEUEJUMP_PUBLIC_KEY;

      const apiUrl =
        container.getAttribute("data-api-url") ||
        window.QUEUEJUMP_API_URL ||
        scriptOrigin ||
        "http://localhost:4000";

      if (!publicKey) {
        console.error("[QueueJump] Missing required data-key attribute (e.g. pk_live_...)");
        return;
      }

      // Check ?ref= parameter in current page URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCodeParam = urlParams.get("ref");
      const theme = container.getAttribute("data-theme") || "dark";
      const isLight = theme === "light";
      const accentColor = container.getAttribute("data-accent") || "#3074FE";

      // Attach Shadow DOM for 100% CSS isolation
      const shadow = container.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = `
        :host { color-scheme: ${isLight ? "light" : "dark"}; }

        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          color: #EDEDED;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        .qj-card {
          background: ${isLight ? "#FFFFFF" : "#0E0E12"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"};
          border-radius: 16px;
          padding: 24px;
          max-width: 440px;
          margin: 0 auto;
          box-shadow: ${isLight ? "0 12px 32px rgba(0, 0, 0, 0.06)" : "0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)"};
          color: ${isLight ? "#0A0A0A" : "#EDEDED"};
        }
        .qj-title {
          font-size: 20px;
          font-weight: 700;
          color: ${isLight ? "#0A0A0A" : "#FFFFFF"};
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .qj-subtitle {
          font-size: 13px;
          color: ${isLight ? "#737373" : "#8E8EA0"};
          margin: 0;
          line-height: 1.4;
        }
        .qj-input {
          width: 100%;
          background: ${isLight ? "#F7F7F8" : "#181822"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)"};
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: ${isLight ? "#0A0A0A" : "#FFFFFF"};
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .qj-input:focus {
          border-color: #3074FE;
          background: ${isLight ? "#FFFFFF" : "#1C1C28"};
        }
        .qj-position-box {
          background: ${isLight ? "#F7F7F8" : "#14141B"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)"};
          border-radius: 12px;
          padding: 18px;
          text-align: center;
          margin-bottom: 16px;
        }
        .qj-position-num {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 38px;
          font-weight: 800;
          color: ${isLight ? "#0A0A0A" : "#FFFFFF"};
          letter-spacing: -0.04em;
          margin: 4px 0;
        }
        .qj-position-label {
          font-size: 12px;
          color: ${isLight ? "#737373" : "#8E8EA0"};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .qj-stat-val {
          font-weight: 700;
          color: ${isLight ? "#0A0A0A" : "#FFFFFF"};
          font-family: monospace;
        }
        .qj-ref-box {
          background: ${isLight ? "#F7F7F8" : "#16161D"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)"};
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 12px;
        }
        .qj-ref-url {
          font-family: monospace;
          font-size: 12px;
          color: ${isLight ? "#52525B" : "#A0A0B0"};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .qj-copy-btn {
          background: ${isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.08)"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"};
          color: ${isLight ? "#0A0A0A" : "#EDEDED"};
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }
        .qj-share-btn {
          background: ${isLight ? "#F4F4F5" : "#181822"};
          border: 1px solid ${isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)"};
          color: ${isLight ? "#52525B" : "#A0A0B2"};
          font-size: 11px;
          font-weight: 600;
          padding: 8px;
          border-radius: 8px;
          text-align: center;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .qj-header {
          margin-bottom: 20px;
        }
        .qj-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(48, 116, 254, 0.12);
          color: #3074FE;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(48, 116, 254, 0.25);
          margin-bottom: 12px;
        }
        .qj-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3074FE;
          box-shadow: 0 0 8px #3074FE;
        }
        .qj-title {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .qj-subtitle {
          font-size: 13px;
          color: #8E8EA0;
          margin: 0;
          line-height: 1.4;
        }
        .qj-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qj-input-group {
          position: relative;
        }
        .qj-input {
          width: 100%;
          background: #181822;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #FFFFFF;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .qj-input:focus {
          border-color: #3074FE;
          background: #1C1C28;
        }
        .qj-btn {
          width: 100%;
          background: ${accentColor};
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.05s;
        }
        .qj-btn:hover {
          filter: brightness(0.92);
        }
        .qj-btn:active {
          transform: translateY(1px);
        }
        .qj-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .qj-error {
          color: #EF4444;
          font-size: 12px;
          margin-top: 6px;
          display: none;
        }
        .qj-position-box {
          background: #14141B;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px;
          text-align: center;
          margin-bottom: 16px;
        }
        .qj-position-num {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 38px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.04em;
          margin: 4px 0;
        }
        .qj-position-label {
          font-size: 12px;
          color: #8E8EA0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .qj-stats-row {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 12px;
          margin-top: 12px;
          font-size: 12px;
        }
        .qj-stat-val {
          font-weight: 700;
          color: #FFFFFF;
          font-family: monospace;
        }
        .qj-ref-box {
          background: #16161D;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 12px;
        }
        .qj-ref-url {
          font-family: monospace;
          font-size: 12px;
          color: #A0A0B0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .qj-copy-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #EDEDED;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }
        .qj-copy-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .qj-share-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .qj-share-btn {
          background: #181822;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #A0A0B2;
          font-size: 11px;
          font-weight: 600;
          padding: 8px;
          border-radius: 8px;
          text-align: center;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .qj-share-btn:hover {
          background: #20202E;
          color: #FFFFFF;
        }
        .qj-powered {
          text-align: center;
          margin-top: 16px;
          font-size: 11px;
          color: #555566;
        }
        .qj-powered a {
          color: #777788;
          text-decoration: none;
          font-weight: 600;
        }
      `;

      shadow.appendChild(style);

      const wrapper = document.createElement("div");
      wrapper.className = "qj-card";

      // Initial Join View
      function renderJoinView() {
        wrapper.innerHTML = `
          <div class="qj-header">
            <div class="qj-badge">
              <span class="qj-badge-dot"></span>
              <span>Live Waitlist</span>
            </div>
            <h3 class="qj-title">Join the Priority Waitlist</h3>
            <p class="qj-subtitle">Reserve your spot in line. Jump positions when you invite friends & teammates.</p>
          </div>
          <form class="qj-form" id="qj-signup-form">
            <div class="qj-input-group">
              <input type="email" class="qj-input" id="qj-email" placeholder="name@company.com" required />
              <div class="qj-error" id="qj-error-msg"></div>
            </div>
            <button type="submit" class="qj-btn" id="qj-submit-btn">
              <span>Get Priority Access</span>
              <span>&rarr;</span>
            </button>
          </form>
          <div class="qj-powered">Powered by <a href="https://queuejump.dev" target="_blank" rel="noopener">QueueJump</a></div>
        `;

        const form = wrapper.querySelector("#qj-signup-form");
        const emailInput = wrapper.querySelector("#qj-email");
        const submitBtn = wrapper.querySelector("#qj-submit-btn");
        const errorMsg = wrapper.querySelector("#qj-error-msg");

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = emailInput.value.trim();
          if (!email) return;

          submitBtn.disabled = true;
          submitBtn.textContent = "Reserving spot...";
          errorMsg.style.display = "none";

          try {
            const currentHostUrl = window.location.origin + window.location.pathname;

            const res = await fetch(`${apiUrl}/api/v1/waitlist/join`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Campaign-Key": publicKey,
              },
              body: JSON.stringify({
                email,
                referralCode: referralCodeParam,
                originUrl: currentHostUrl,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error?.message || "Failed to join waitlist.");
            }

            // Render Success / Position View
            renderPositionView(data);
          } catch (err) {
            errorMsg.textContent = err.message;
            errorMsg.style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "Get Priority Access →";
          }
        });
      }

      function renderPositionView(data) {
        // Guarantee referral link points to the host website where this widget is embedded
        const currentHostUrl = window.location.origin + window.location.pathname;
        const hostReferralLink = `${currentHostUrl}?ref=${data.referralCode}`;
        const activeReferralLink = data.referralLink && !data.referralLink.includes("localhost")
          ? data.referralLink
          : hostReferralLink;

        const shareText = encodeURIComponent(`I just claimed spot #${data.position} on the waitlist! Jump ahead with me:`);
        const shareUrl = encodeURIComponent(activeReferralLink);

        wrapper.innerHTML = `
          <div class="qj-header">
            <div class="qj-badge">
              <span class="qj-badge-dot"></span>
              <span>Position Reserved</span>
            </div>
            <h3 class="qj-title">You're on the list!</h3>
            <p class="qj-subtitle">Refer friends to jump ahead and unlock priority access.</p>
          </div>
          <div class="qj-position-box">
            <div class="qj-position-label">Current Queue Position</div>
            <div class="qj-position-num">#${data.position}</div>
            <div class="qj-stats-row">
              <span style="color:#8E8EA0">Total in line: <span class="qj-stat-val">${data.totalParticipants}</span></span>
              <span style="color:#8E8EA0">Referrals verified: <span class="qj-stat-val">${data.verifiedReferrals}</span></span>
            </div>
          </div>
          <div style="font-size: 11px; text-transform: uppercase; color: #8E8EA0; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 6px;">
            Your Unique Invite Link
          </div>
          <div class="qj-ref-box">
            <span class="qj-ref-url" title="${activeReferralLink}">${activeReferralLink}</span>
            <button class="qj-copy-btn" id="qj-copy-link-btn">Copy</button>
          </div>
          <div class="qj-share-grid">
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" class="qj-share-btn">
              Twitter / X
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener" class="qj-share-btn">
              LinkedIn
            </a>
            <a href="https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener" class="qj-share-btn">
              WhatsApp
            </a>
          </div>
          <div class="qj-powered">Powered by <a href="https://queuejump.dev" target="_blank" rel="noopener">QueueJump</a></div>
        `;

        const copyBtn = wrapper.querySelector("#qj-copy-link-btn");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(activeReferralLink);
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 2000);
        });
      }

      renderJoinView();
      shadow.appendChild(wrapper);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQueueJumpWidget);
  } else {
    initQueueJumpWidget();
  }
})();
