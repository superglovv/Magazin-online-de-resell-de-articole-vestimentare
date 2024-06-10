window.addEventListener("load", function () {
  var initialOrder = Array.from(document.querySelectorAll(".produs"));

  var prices = Array.from(document.querySelectorAll(".val-pret")).map((elem) =>
    parseFloat(elem.innerHTML)
  );

  var minPrice = Math.min(...prices.filter((price) => !isNaN(price)));
  var maxPrice = Math.max(...prices.filter((price) => !isNaN(price)));

  document.getElementById("minPrice").innerText = minPrice;
  document.getElementById("maxPrice").innerText = maxPrice;
  document.getElementById("inp-pret").value = minPrice;
  document.getElementById("inp-pret").max = maxPrice;
  document.getElementById("infoRange").innerText = `(${minPrice})`;

  var textarea = document.getElementById("inp-descriere");

  textarea.addEventListener("input", function () {
    var produse = document.getElementsByClassName("produs");

    var isValid = false;
    for (let produs of produse) {
      let descriereElement = produs.getElementsByClassName("val-descriere")[0];
      if (descriereElement) {
        let valDescriere = descriereElement.innerHTML.toLowerCase().trim();
        if (
          normalizeText(valDescriere).includes(
            normalizeText(textarea.value.toLowerCase().trim())
          )
        ) {
          isValid = true;
          break;
        }
      }
    }
    if (isValid) {
      textarea.classList.remove("is-invalid");
      textarea.classList.add("is-valid");
    } else {
      textarea.classList.remove("is-valid");
      textarea.classList.add("is-invalid");
    }
  });

  document.getElementById("inp-pret").onchange = function () {
    document.getElementById("infoRange").innerHTML = `(${this.value})`;
  };

  // document.getElementById("filtrare").addEventListener("click", function(){ })
  document.getElementById("filtrare").onclick = function () {
    var inpNume = normalizeText(
      document.getElementById("inp-nume").value.toLowerCase().trim()
    );

    var inpCuloare = document
      .getElementsByName("inp-culoare")[0]
      .value.trim()
      .toLowerCase();

    const selectedConditions = Array.from(
      document.getElementsByName("gr_check")
    )
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    var selectedStiluri = Array.from(
      document.getElementById("inp-stil").selectedOptions
    ).map((option) => option.value);

    console.log(selectedConditions);

    const selectedTehnologie = Array.from(
      document.getElementsByName("gr_check2")
    )
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const radioButtonValue = document.querySelector(
      'input[name="nougr_rad"]:checked'
    ).value;

    var radioCalorii = document.getElementsByName("gr_rad");
    let inpCalorii;
    for (let rad of radioCalorii) {
      if (rad.checked) {
        inpCalorii = rad.value;
        break;
      }
    }
    let minCalorii, maxCalorii;
    if (inpCalorii != "toate") {
      vCal = inpCalorii.split(":");
      minCalorii = parseInt(vCal[0]);
      maxCalorii = parseInt(vCal[1]);
    }

    var inpPret = parseInt(document.getElementById("inp-pret").value);

    var inpCateg = document
      .getElementById("inp-categorie")
      .value.toLowerCase()
      .trim();

    var produse = document.getElementsByClassName("produs");
    var hasResults = false;
    for (let produs of produse) {
      let valNume = produs
        .getElementsByClassName("val-nume")[0]
        .innerHTML.toLowerCase()
        .trim();

      let mismatchCount = 0;
      for (let i = 0; i < Math.min(valNume.length, inpNume.length); i++) {
        if (valNume[i] !== inpNume[i]) {
          mismatchCount++;
          if (mismatchCount > 2) {
            break;
          }
        }
      }

      let cond1 =
        mismatchCount <= 2 &&
        valNume.startsWith(inpNume.slice(0, -Math.min(mismatchCount, 2)));

      let valCalorii = parseInt(
        produs.getElementsByClassName("val-calorii")[0].innerHTML
      );

      let cond2 =
        inpCalorii == "toate" ||
        (minCalorii <= valCalorii && valCalorii < maxCalorii);

      let valPret = parseFloat(
        produs.getElementsByClassName("val-pret")[0].innerHTML
      );
      let cond3 = valPret > inpPret;

      let valCategorie = produs
        .getElementsByClassName("val-categorie")[0]
        .innerHTML.toLowerCase()
        .trim();
      let cond4 = inpCateg == valCategorie || inpCateg == "toate";

      let valCuloare = produs
        .getElementsByClassName("val-culoare")[0]
        .innerHTML.toLowerCase()
        .trim();
      console.log(valCuloare);
      let cond5 = valCuloare.startsWith(inpCuloare) || inpCuloare == "";

      let valConditie = produs
        .getElementsByClassName("val-conditie")[0]
        .innerHTML.trim();

      let cond6 =
        selectedConditions.length === 0 ||
        selectedConditions.includes(valConditie);

      let valStil = produs
        .getElementsByClassName("val-stil")[0]
        .innerHTML.trim();
      let cond7 =
        selectedStiluri.length === 0 ||
        selectedStiluri.includes(valStil) ||
        selectedStiluri[0] === "toate";

      let cond8 =
        produs.getElementsByClassName("val-descriere")[0] &&
        normalizeText(
          produs
            .getElementsByClassName("val-descriere")[0]
            .innerHTML.toLowerCase()
            .trim()
        ).includes(normalizeText(textarea.value.toLowerCase().trim()));

      let cond9 = true;
      if (selectedTehnologie.length > 0) {
        const valoriTehnologie = Array.from(
          produs.getElementsByClassName("val-tehnologie")
        )
          .map((elem) => elem.innerHTML.toLowerCase().trim().split(","))
          .flat();

        console.log("selectedTehnologie:", selectedTehnologie);
        console.log("valoriTehnologie:", valoriTehnologie);

        if (radioButtonValue === "are") {
          cond9 = selectedTehnologie.every((value) =>
            valoriTehnologie.includes(value)
          );
        } else {
          cond9 = !selectedTehnologie.some((value) =>
            valoriTehnologie.includes(value)
          );
        }
        console.log("cond9:", cond9);
      }

      if (
        cond1 &&
        cond2 &&
        cond3 &&
        cond4 &&
        cond5 &&
        cond6 &&
        cond7 &&
        cond8 &&
        cond9
      ) {
        produs.style.display = "block";
        hasResults = true;
      } else {
        produs.style.display = "none";
      }
      document.getElementById("no-results-message").style.display = hasResults
        ? "none"
        : "block";
    }
  };

  // var noResultsMessage = document.getElementById("results-message");
  // if (hasResults == false) {
  //   noResultsMessage.style.display = "none";
  // } else {
  //   noResultsMessage.style.display = "block";
  // }

  document.getElementById("resetare").onclick = function () {
    var confirmReset = confirm("Sigur dorești să resetezi filtrele?");
    if (confirmReset) {
      document.getElementById("inp-nume").value = "";
      document.getElementById("inp-descriere").value = "";
      document.getElementById("inp-culoare").value = "";
      document.getElementById("inp-stil").value = "toate";

      document.getElementById("inp-pret").value =
        document.getElementById("inp-pret").min;
      document.getElementById("inp-categorie").value = "toate";
      document.getElementById("i_rad5").checked = true;

      document.getElementById("i_check1").checked = true;
      document.getElementById("i_check2").checked = true;

      document.getElementById("infoRange").innerHTML = `(${minPrice})`;

      var checkboxes = document.getElementsByName("gr_check2");
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = false;
      });

      document.querySelector(
        'input[name="nougr_rad"][value="are"]'
      ).checked = true;

      var produse = document.getElementsByClassName("produs");
      for (let prod of produse) {
        prod.style.display = "block";
      }
    }
  };

  function sorteaza(semn) {
    var produse = document.getElementsByClassName("produs");
    let v_produse = Array.from(produse);
    v_produse.sort(function (a, b) {
      let pret_a = parseInt(a.getElementsByClassName("val-pret")[0].innerHTML);
      let pret_b = parseInt(b.getElementsByClassName("val-pret")[0].innerHTML);
      if (pret_a == pret_b) {
        let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML;
        let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML;
        return semn * nume_a.localeCompare(nume_b);
      }
      return semn * (pret_a - pret_b);
    });
    console.log(v_produse);
    for (let prod of v_produse) {
      prod.parentNode.appendChild(prod);
    }
  }

  document.getElementById("sortCrescNume").onclick = function () {
    sorteaza(1);
  };
  document.getElementById("sortDescrescNume").onclick = function () {
    sorteaza(-1);
  };

  window.onkeydown = function (e) {
    if (e.key == "c" && e.altKey) {
      var suma = 0;
      var produse = document.getElementsByClassName("produs");
      for (let produs of produse) {
        var stil = getComputedStyle(produs);
        if (stil.display != "none") {
          suma += parseFloat(
            produs.getElementsByClassName("val-pret")[0].innerHTML
          );
        }
      }
      if (!document.getElementById("par_suma")) {
        let p = document.createElement("p");
        p.innerHTML = suma;
        p.id = "par_suma";
        container = document.getElementById("produse");
        container.insertBefore(p, container.children[0]);
        setTimeout(function () {
          var pgf = document.getElementById("par_suma");
          if (pgf) pgf.remove();
        }, 2000);
      }
    }
  };
  function normalizeText(text) {
    const diacriticsMap = {
      ă: "a",
      â: "a",
      î: "i",
      ș: "s",
      ț: "t",
      Ă: "A",
      Â: "A",
      Î: "I",
      Ș: "S",
      Ț: "T",
    };
    return text.replace(/[ăâîșțĂÂÎȘȚ]/g, function (match) {
      return diacriticsMap[match];
    });
  }

  document.getElementById("calculeaza-media").onclick = function () {
    var produseVizibile = Array.from(document.getElementsByClassName("produs"));

    var sumaPreturi = 0;
    produseVizibile.forEach(function (produs) {
      sumaPreturi += parseFloat(
        produs.getElementsByClassName("val-pret")[0].innerText
      );
    });

    var numarProduse = produseVizibile.length;
    var mediaPreturilor = sumaPreturi / numarProduse;

    var divSuma = document.createElement("div");
    divSuma.innerHTML = `Media prețurilor produselor afișate: ${mediaPreturilor.toFixed(
      2
    )} lei`;
    divSuma.style.position = "fixed";
    divSuma.style.top = "50%";
    divSuma.style.left = "50%";
    divSuma.style.transform = "translate(-50%, -50%)";
    divSuma.style.padding = "10px";
    divSuma.style.backgroundColor = "#d1a684";
    divSuma.style.color = "#000000";
    divSuma.style.border = "1px solid #cfc6a9";
    divSuma.style.borderRadius = "5px";
    divSuma.style.zIndex = "9999";
    document.body.appendChild(divSuma);

    setTimeout(function () {
      divSuma.remove();
    }, 2000);
  };
});
