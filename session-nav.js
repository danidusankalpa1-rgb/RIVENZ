import { getAuth, onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);

(function () {

  let currentUser = null;

  function apply(user) {

    currentUser = user || null;

    const logged = !!user;

    document.querySelectorAll(".nav").forEach(nav => {

      // Remove admin links from client navigation
      nav.querySelectorAll('a[href="admin.html"]').forEach(a => a.remove());

      const login = nav.querySelector(".nav-login");

      if (login) {

        if (logged) {

          login.textContent = "My Profile";
          login.href = "dashboard.html";

          login.classList.remove("nav-login");
          login.classList.add("nav-profile");

        } else {

          login.textContent = "Login";
          login.href = "auth.html";

          login.classList.remove("nav-profile");
          login.classList.add("nav-login");

        }
      }

      // Keep only one profile link
      if (logged) {

        const profileLinks = [
          ...nav.querySelectorAll('a[href="dashboard.html"]')
        ];

        const primary = nav.querySelector(".nav-profile");

        profileLinks.forEach(a => {

          if (primary && a !== primary) {

            a.remove();

          } else if (!primary) {

            a.textContent = "My Profile";
            a.classList.add("nav-profile");

          }

        });

      }

      // Add Logout button
      if (logged && !nav.querySelector(".nav-logout")) {

        const logoutLink = document.createElement("a");

        logoutLink.href = "#";
        logoutLink.textContent = "Logout";
        logoutLink.className = "nav-logout";

        logoutLink.addEventListener("click", async function (e) {

          e.preventDefault();

          try {

            await signOut(auth);

            window.location.href = "index.html";

          } catch (error) {

            console.error("Logout error:", error);

          }

        });

        nav.appendChild(logoutLink);

      }

      // Remove logout when logged out
      if (!logged) {

        nav.querySelectorAll(".nav-logout")
          .forEach(a => a.remove());

      }

    });

  }

  // Firebase login state listener
  onAuthStateChanged(auth, function (user) {

    apply(user);

  });

  window.graphicsClientLogout = async function () {

    try {

      await signOut(auth);

      window.location.href = "index.html";

    } catch (error) {

      console.error("Logout error:", error);

    }

  };

})();