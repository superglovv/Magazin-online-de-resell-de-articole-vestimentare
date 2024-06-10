//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare) {
  //timpExpirare in milisecunde
  d = new Date();
  d.setTime(d.getTime() + timpExpirare);
  document.cookie = `${nume}=${val}; expires=${d.toUTCString()}`;
}

function setLastVisitedPage() {
  const lastVisitedPage = new URL(document.referrer).pathname;
  if (lastVisitedPage) {
    setCookie("last_visited_page", lastVisitedPage, 604800000);
  }
}

function getLastVisitedPage() {
  const lastVisitedPage = getCookie("last_visited_page");
  if (lastVisitedPage) {
    return lastVisitedPage;
  } else {
    return "Nu există informații despre ultima pagină vizitată.";
  }
}

function getCookie(nume) {
  vectorParametri = document.cookie.split(";"); // ["a=10","b=ceva"]
  for (let param of vectorParametri) {
    if (param.trim().startsWith(nume + "=")) return param.split("=")[1];
  }
  return null;
}

function deleteCookie(nume) {
  console.log(`${nume}; expires=${new Date().toUTCString()}`);
  document.cookie = `${nume}=0; expires=${new Date().toUTCString()}`;
  document.getElementById("banner").style.display = "block";
}

function deleteAllCookies() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=0; expires=${new Date().toUTCString()}`;
  }
}

window.addEventListener("load", function () {
  if (getCookie("acceptat_banner")) {
    document.getElementById("banner").style.display = "none";
    document.getElementById("ultima-pagina").style.display = "block";

    document.getElementById("ultima-pagina").innerHTML =
      "Ultima pagină vizitată este: " +
      getLastVisitedPage() +
      '<button id="ok_cookies2" class="ok_cookies2">Elimina</button>';

    document.getElementById("ok_cookies2").onclick = function () {
      document.getElementById("ultima-pagina").style.display = "none";
      deleteCookie("acceptat_banner");
    };

    // document.getElementById("ok_cookies2").onclick = function () {
    //   document.getElementById("ultima-pagina").style.display = "none";
    //   deleteAllCookies();
    //   document.getElementById("banner").style.display = "block";
    // };
  }

  document.getElementById("ok_cookies").onclick = function () {
    setCookie("acceptat_banner", true, 60000);
    document.getElementById("banner").style.display = "none";
  };

  setLastVisitedPage();
  // setari coockies setate sa expire/ reapara dupa o saptamana
  //   this.document.getElementById("ok_cookies").onclick = function () {
  //     setCookie("acceptat_banner", true, 604800000);
  //     document.getElementById("banner").style.display = "none";
  //   };
});
