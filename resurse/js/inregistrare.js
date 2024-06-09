window.onload = function () {
  var formular = document.getElementById("form_inreg");
  if (formular) {
    formular.onsubmit = function () {
      if (
        document.getElementById("parl").value !=
        document.getElementById("rparl").value
      ) {
        alert(
          'Nu ati introdus acelasi sir pentru campurile "parola" si "reintroducere parola".'
        );
        return false;
      }

      // Verificare 1: Parola trebuie să aibă cel puțin 8 caractere
      if (document.getElementById("parl").value.length < 8) {
        alert("Parola trebuie să conțină cel puțin 8 caractere.");
        return false;
      }

      // Verificare 2: Email-ul trebuie să fie într-un format valid
      var email = document.getElementById("inp-email").value;
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Introduceți o adresă de email validă.");
        return false;
      }

      return true;
    };
  }
};
