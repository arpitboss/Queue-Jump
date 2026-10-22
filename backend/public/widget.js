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

      const publicKey =
        container.getAttribute("data-key") ||
        document.currentScript?.getAttribute("data-key") ||
        window.QUEUEJUMP_PUBLIC_KEY;

      const apiUrl =
        container.getAttribute("data-api-url") ||
        window.QUEUEJUMP_API_URL ||
        "http://localhost:4000";

      if (!publicKey) {
        console.error("[QueueJump] Missing required data-key attribute (e.g. pk_live_...)");
        return;
      }

      // Check ?ref= parameter in current page URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCodeParam = urlParams.get("ref");

      // Attach Shadow DOM for 100% CSS isolation
      const shadow = container.attachShadow({ mode: "open" });

      const style = document.createElement("style");
      style.textContent = `
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
          background: #0E0E12;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          max-width: 440px;
          margin: 0 auto;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .qj-header {
          margin-bottom: 20px;
        }
        .qj-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          margin-bottom: 12px;
        }
        .qj-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
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
          background: #16161D;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #FFFFFF;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .qj-input:focus {
          border-color: #FF4F00;
          box-shadow: 0 0 0 2px rgba(255, 79, 0, 0.2);
        }
        .qj-input::placeholder {
          color: #555566;
        }
        .qj-btn {
          width: 100%;
          background: #FF4F00;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s, background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .qj-btn:hover {
          background: #FF661A;
        }
        .qj-btn:active {
          transform: scale(0.98);
        }
        .qj-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .qj-error {
          font-size: 12px;
          color: #EF4444;
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
            <h3 class="qj-title">Join the Private Beta</h3>
            <p class="qj-subtitle">Reserve your spot in line. Jump positions when you invite fellow founders.</p>
          </div>
          <form class="qj-form" id="qj-signup-form">
            <div class="qj-input-group">
              <input type="email" class="qj-input" id="qj-email" placeholder="name@company.com" required />
              <div class="qj-error" id="qj-error-msg"></div>
            </div>
            <button type="submit" class="qj-btn" id="qj-submit-btn">
              <span>Get Early Access</span>
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
          submitBtn.textContent = "Reserving...";
          errorMsg.style.display = "none";

          try {
            const res = await fetch(`${apiUrl}/api/v1/waitlist/join`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Campaign-Key": publicKey,
              },
              body: JSON.stringify({
                email,
                referralCode: referralCodeParam,
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
            submitBtn.textContent = "Get Early Access →";
          }
        });
      }

      function renderPositionView(data) {
        const shareText = encodeURIComponent(`I'm #${data.position} on the waitlist! Join here:`);
        const shareUrl = encodeURIComponent(data.referralLink);

        wrapper.innerHTML = `
          <div class="qj-header">
            <div class="qj-badge">
              <span class="qj-badge-dot"></span>
              <span>Position Reserved</span>
            </div>
            <h3 class="qj-title">You're on the list!</h3>
            <p class="qj-subtitle">Refer friends to jump ahead and unlock priority perks.</p>
          </div>
          <div class="qj-position-box">
            <div class="qj-position-label">Current Queue Position</div>
            <div class="qj-position-num">#${data.position}</div>
            <div class="qj-stats-row">
              <span style="color:#8E8EA0">Total in line: <span class="qj-stat-val">${data.totalParticipants}</span></span>
              <span style="color:#8E8EA0">Referrals verified: <span class="qj-stat-val">${data.verifiedReferrals}</span></span>
            </div>
          </div>

          <div style="font-size:12px; font-weight:600; color:#EDEDED; margin-bottom:4px">Your Personal Referral Link:</div>
          <div class="qj-ref-box">
            <span class="qj-ref-url" id="qj-ref-text">${data.referralLink}</span>
            <button class="qj-copy-btn" id="qj-copy-trigger">Copy Link</button>
          </div>

          <div class="qj-share-grid">
            <a class="qj-share-btn" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener">Share on X</a>
            <a class="qj-share-btn" href="https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="qj-share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener">LinkedIn</a>
          </div>

          <div class="qj-powered">Powered by <a href="https://queuejump.dev" target="_blank" rel="noopener">QueueJump</a></div>
        `;

        const copyBtn = wrapper.querySelector("#qj-copy-trigger");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(data.referralLink);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy Link"), 2000);
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

  window.QueueJump = {
    init: initQueueJumpWidget,
  };
})();