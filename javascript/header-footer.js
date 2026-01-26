// javascript/header.js

document.addEventListener("DOMContentLoaded", function () {

  // ================== HEADER ==================
  const headerPlaceholder = document.getElementById("headerPlaceholder");

  if (headerPlaceholder) {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const headerFile = isLoggedIn
      ? "includes/header-loggedin.html"
      : "includes/header.html";

    fetch(headerFile)
      .then(r => {
        if (!r.ok) throw new Error("Header 404: " + headerFile);
        return r.text();
      })
      .then(html => {
        headerPlaceholder.outerHTML = html;

        // ==== After header loads → activate correct nav item ====
        const current = window.location.pathname.split("/").pop();
        const links = document.querySelectorAll("nav a");

        links.forEach(a => {
          if (a.getAttribute("href") === current) {
            a.classList.add("active");
          }
        });

        // ==== If user logged in → update avatar & name ====
        if (isLoggedIn) {
          const nameEl = document.getElementById("userName");
          const avatarEl = document.getElementById("userAvatar");
          if (nameEl) nameEl.textContent = localStorage.getItem("userName") || "User";
          if (avatarEl) avatarEl.src = localStorage.getItem("userAvatar") || avatarEl.src;
        }
      })
      .catch(err => {
        console.error(err);
        headerPlaceholder.innerHTML =
          "<p style='color:red;text-align:center;padding:1rem;'>Header failed to load</p>";
      });
  }

  // ================== FOOTER ==================
  const footerPlaceholder = document.getElementById("footerPlaceholder");

  if (footerPlaceholder) {
    fetch("includes/footer.html")
      .then(r => {
        if (!r.ok) throw new Error("Footer 404");
        return r.text();
      })
      .then(html => {
        footerPlaceholder.outerHTML = html;
      })
      .catch(err => {
        console.error(err);
        footerPlaceholder.innerHTML =
          "<p style='color:red;text-align:center;padding:1rem;'>Footer failed to load</p>";
      });
  }

  // === SECRET ADMIN SHORTCUT ===
  let altPressed = false;

  document.addEventListener('keydown', e => {
    if (e.key === 'Alt') altPressed = true;
    if (altPressed && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      window.location.href = 'admin-login.html';
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'Alt') altPressed = false;
  });

});

// Logout function
function logout() {
  window.location.href = 'php/logout.php';
}


