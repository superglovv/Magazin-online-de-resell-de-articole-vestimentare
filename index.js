const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const ejs = require("ejs");
const AccesBD = require("./module_proprii/accesbd.js");

const formidable = require("formidable");
const { Utilizator } = require("./module_proprii/utilizator.js");
const session = require("express-session");
const Drepturi = require("./module_proprii/drepturi.js");
const utilizator = require("./module_proprii/utilizator.js");
const Client = require("pg").Client;
const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");

const xmljs = require("xml-js");
const { MongoClient } = require("mongodb");

var client = new Client({
  database: "cti_2024",
  user: "superuser",
  password: "superuser",
  host: "localhost",
  port: 5432,
});
client.connect();

// client.query(
//   "select * from unnest(enum_range(null::categ_prajitura))",
//   function (err, rez) {}
// );

client.query(
  "select * from unnest(enum_range(null::branduri))",
  function (err, rez) {}
);

// client.query("select * from prajituri", function (err, rez) {
//   console.log(rez);
// });

client.query("select * from produse", function (err, rez) {
  console.log(rez);
});

obGlobal = {
  obErori: null,
};

app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.use(
  session({
    // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: "abcdefg", //folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false,
  })
);

client.query(
  "select * from unnest(enum_range(null::tip_vestimentar))",
  function (err, rezCategorie) {
    if (err) {
      console.log(err);
    } else {
      obGlobal.optiuniMeniu = rezCategorie.rows;
    }
  }
);
app.use("/*", function (req, res, next) {
  res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
  res.locals.Drepturi = Drepturi;
  if (req.session.utilizator) {
    req.utilizator = res.locals.utilizator = new Utilizator(
      req.session.utilizator
    );
  }
  next();
});

app.set("view engine", "ejs");

vect_foldere = ["temp", "temp1", "backup", "poze_uploadate"];
for (let folder of vect_foldere) {
  let calefolder = path.join(__dirname, folder);
  if (!fs.existsSync(calefolder)) {
    fs.mkdirSync(calefolder);
  }
}

app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

// --------------------------utilizatori online ------------------------------------------

function getIp(req) {
  //pentru Heroku/Render
  var ip = req.headers["x-forwarded-for"]; //ip-ul userului pentru care este forwardat mesajul
  if (ip) {
    let vect = ip.split(",");
    return vect[vect.length - 1];
  } else if (req.ip) {
    return req.ip;
  } else {
    return req.connection.remoteAddress;
  }
}

app.all("/*", function (req, res, next) {
  let ipReq = getIp(req);
  if (ipReq) {
    var id_utiliz = req?.session?.utilizator?.id;
    //id_utiliz=id_utiliz?id_utiliz:null;
    //console.log("id_utiliz", id_utiliz);
    // TO DO comanda insert (folosind AccesBD) cu  ip, user_id, pagina(url  din request)
    var obiectInsert = {
      ip: ipReq,
      pagina: req.url,
    };
    if (id_utiliz) obiectInsert.user_id = id_utiliz;
    AccesBD.getInstanta().insert({
      tabel: "accesari",
      campuri: obiectInsert,
    });
  }
  next();
});

function stergeAccesariVechi() {
  AccesBD.getInstanta().delete(
    {
      tabel: "accesari",
      conditiiAnd: ["now() - data_accesare >= interval '10 minutes' "],
    },
    function (err, rez) {
      console.log(err);
    }
  );
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10 * 60 * 1000);

async function obtineUtilizatoriOnlineActivi() {
  try {
    var rez = await client.query(
      "select username, nume, prenume from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <= interval '5 minutes')"
    );
    console.log(rez.rows);
    return rez.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function obtineUtilizatoriOnlineInactivi() {
  try {
    var rez = await client.query(
      "SELECT username, nume, prenume FROM utilizatori WHERE id NOT IN (SELECT DISTINCT user_id FROM accesari WHERE now() - data_accesare <= interval '10 minutes')"
    );

    return rez.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// app.get("/", function(req, res){
//     res.sendFile(__dirname+"/index.html")
// })

// app.use(function (req, res, next) {
//   client.query(
//     "select * from unnest(enum_range(null::categ_prajitura))",
//     function (err, rezOptiuni) {
//       res.locals.optiuniMeniu = rezOptiuni.rows;
//       next();
//     }
//   );
// });

app.use(function (req, res, next) {
  client.query(
    "select * from unnest(enum_range(null::branduri))",
    function (err, rezOptiuni) {
      res.locals.optiuniMeniu = rezOptiuni.rows;
      next();
    }
  );
});

function genereazaEvenimente() {
  var evenimente = [];
  var texteEvenimente = [
    "Eveniment important",
    "Festivitate",
    "Prajituri gratis",
    "Zi cu soare",
    "Aniversare",
  ];
  var dataCurenta = new Date();
  for (i = 0; i < texteEvenimente.length; i++) {
    evenimente.push({
      data: new Date(
        dataCurenta.getFullYear(),
        dataCurenta.getMonth(),
        Math.ceil(Math.random() * 27)
      ),
      text: texteEvenimente[i],
    });
  }
  return evenimente;
}

//--------------------------------------locatie---------------------------------------
async function obtineLocatie() {
  try {
    const response = await fetch(
      "https://secure.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=109.99.96.15"
    );
    const obiectLocatie = await response.json();
    console.log(obiectLocatie);
    locatie =
      obiectLocatie.geobytescountry + " " + obiectLocatie.geobytesregion;
    return locatie;
  } catch (error) {
    console.error(error);
  }
}

app.get(["/", "/home", "/index"], async function (req, res) {
  try {
    const tipuriResult = await client.query(
      "select * from unnest(enum_range(null::tip_vestimentar))"
    );
    const produseRez = await client.query(
      "select * from produse order by RANDOM() limit 5"
    );
    res.render("pagini/index", {
      ip: req.ip,
      imagini: obGlobal.obImagini.imagini,
      useriOnline: await obtineUtilizatoriOnlineActivi(),
      useriOnlineInactivi: await obtineUtilizatoriOnlineInactivi(),
      locatie: await obtineLocatie(),
      evenimente: genereazaEvenimente(),
      tipuri: tipuriResult.rows,
      produse: produseRez.rows,
      shortenText: shortenText,
    });
  } catch (err) {
    console.log(err);
    afisareEroare(res, 2);
  }
});

app.get("/random-products", async (req, res) => {
  try {
    const produseRez = await client.query(
      "SELECT * FROM produse ORDER BY RANDOM() LIMIT 5"
    );
    res.json(produseRez.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch random products" });
  }
});

// --------------------- Produse ----------------

// app.get("/produse", function (req, res) {
//   client.query("select * from prajituri", function (err, rez) {
//     if (err) {
//       console.log(err);
//       afisareEroare(res, 2);
//     } else {
//       res.render("pagini/produse", { produse: rez.rows, optiuni: [] });
//     }
//   });
// });

function formatDate(dateString) {
  const daysOfWeek = [
    "Duminică",
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
  ];
  const months = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie",
  ];

  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const dayOfWeek = daysOfWeek[date.getDay()];

  return `${day} ${month} ${year} [${dayOfWeek}]`;
}

function shortenText(text) {
  if (!text || text.length <= 100) {
    return text || "";
  }
  const truncated = text.substring(0, 100);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace === -1
    ? truncated + "..."
    : truncated.substring(0, lastSpace) + "...";
}

app.get("/produse", function (req, res) {
  console.log(req.query);
  var conditieQuery = "";
  if (req.query.tip) {
    conditieQuery = ` where tip ='${req.query.tip}'`;
  }
  client.query(
    "select * from unnest(enum_range(null::branduri))",
    function (err, rezBranduri) {
      client.query(
        "select * from unnest(enum_range(null::tip_vestimentar))",
        function (err, rezTipuri) {
          client.query(
            "select * from unnest(enum_range(null::stiluri))",
            function (err, rezStiluri) {
              client.query(
                `select * from produse ${conditieQuery}`,
                function (err, rezProduse) {
                  if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                  } else {
                    res.render("pagini/produse", {
                      produse: rezProduse.rows,
                      branduri: rezBranduri.rows,
                      tipuri: rezTipuri.rows,
                      stiluri: rezStiluri.rows,
                      formatDate: formatDate,
                      shortenText: shortenText,
                    });
                  }
                }
              );
            }
          );
        }
      );
    }
  );
});

app.get("/produs/:id", function (req, res) {
  client.query(
    `select * from produse where id=${req.params.id}`,
    function (err, rez) {
      if (err) {
        console.log(err);
        afisareEroare(res, 2);
      } else {
        res.render("pagini/produs", {
          prod: rez.rows[0],
          formatDate: formatDate,
        });
      }
    }
  );
});

app.get("/admin", function (req, res) {
  if (req?.utilizator.areDreptul(Drepturi.vizualizareUtilizatori)) {
    console.log(req.query);
    var conditieQuery = "";
    if (req.query.tip) {
      conditieQuery = ` where tip ='${req.query.tip}'`;
    }
    client.query(
      "select * from unnest(enum_range(null::branduri))",
      function (err, rezBranduri) {
        client.query(
          "select * from unnest(enum_range(null::tip_vestimentar))",
          function (err, rezTipuri) {
            client.query(
              "select * from unnest(enum_range(null::stiluri))",
              function (err, rezStiluri) {
                client.query(
                  `select * from produse ${conditieQuery}`,
                  function (err, rezProduse) {
                    if (err) {
                      console.log(err);
                      afisareEroare(res, 2);
                    } else {
                      res.render("pagini/creare_produse", {
                        produse: rezProduse.rows,
                        branduri: rezBranduri.rows,
                        tipuri: rezTipuri.rows,
                        stiluri: rezStiluri.rows,
                        formatDate: formatDate,
                        shortenText: shortenText,
                      });
                    }
                  }
                );
              }
            );
          }
        );
      }
    );
  } else {
    afisareEroare(res, 403);
  }
});

app.post("/adauga_produs", function (req, res) {
  var nume = req.body["nume"];
  var descriere = req.body["descriere"];
  var pret = req.body["pret"];
  var pret_lansare = req.body["pret_lansare"];
  var tip_vestimentar = req.body["tip_vestimentar"];
  var brand = req.body["brand"];
  var marime = req.body["marime"];
  var culoare = req.body["culoare"];
  var nou = req.body["nou"] === "true";
  var imagine = req.body["imagine"];
  var stil = req.body["stil"];
  var tehnologie = req.body["tehnologie"];

  if (
    !nume ||
    !descriere ||
    !pret ||
    !pret_lansare ||
    !tip_vestimentar ||
    !brand ||
    !marime ||
    !culoare ||
    !imagine ||
    !stil
  ) {
    res.status(400).send("Toate câmpurile trebuie completate.");
    return;
  }

  client.query(
    "INSERT into produse (nume,descriere,pret,pret_lansare,tip,brand,marime,culoare,nou,imagine) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    [
      nume,
      descriere,
      pret,
      pret_lansare,
      tip_vestimentar,
      brand,
      marime,
      culoare,
      nou,
      imagine,
      stil,
      tehnologie,
    ],
    function (err, res) {
      if (err) {
        console.log(err);
        afisareEroare(res, 2);
      } else {
        res.redirect("/pagina_de_succes");
      }
    }
  );
});

// ---------------------------------  cos virtual --------------------------------------

app.use(["/produse_cos", "/cumpara"], express.json({ limit: "2mb" })); //obligatoriu de setat pt request body de tip json

app.post("/produse_cos", function (req, res) {
  console.log(req.body);
  if (req.body.ids_prod.length != 0) {
    //TO DO : cerere catre AccesBD astfel incat query-ul sa fie `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
    AccesBD.getInstanta().select(
      {
        tabel: "produse",
        campuri:
          "nume,descriere,pret,pret_lansare,tip,brand,marime,culoare,nou,imagine".split(
            ","
          ),
        conditiiAnd: [`id in (${req.body.ids_prod})`],
      },
      function (err, rez) {
        if (err) res.send([]);
        else res.send(rez.rows);
      }
    );
  } else {
    res.send([]);
  }
});

cale_qr = __dirname + "/resurse/imagine/qrcode";
if (fs.existsSync(cale_qr))
  fs.rmSync(cale_qr, { force: true, recursive: true });
fs.mkdirSync(cale_qr);
client.query("select id from produse", function (err, rez) {
  for (let prod of rez.rows) {
    let cale_prod =
      obGlobal.protocol + obGlobal.numeDomeniu + "/produs/" + prod.id;
    //console.log(cale_prod);
    QRCode.toFile(cale_qr + "/" + prod.id + ".png", cale_prod);
  }
});

async function genereazaPdf(stringHTML, numeFis, callback) {
  const chrome = await puppeteer.launch();
  const document = await chrome.newPage();
  console.log("inainte load");
  //await document.setContent(stringHTML, {waitUntil:"load"});
  await document.setContent(stringHTML, { waitUntil: "load" });

  console.log("dupa load");
  await document.pdf({ path: numeFis, format: "A4" });

  console.log("dupa pdf");
  await chrome.close();

  console.log("dupa inchidere");
  if (callback) callback(numeFis);
}

// function insereazaFactura(req, rezultatRanduri) {
//   rezultatRanduri.rows.forEach(function (elem) {
//     elem.cantitate = 1;
//   });
//   let jsonFactura = {
//     data: new Date(),
//     username: req.session.utilizator.username,
//     produse: rezultatRanduri.rows,
//   };
//   console.log("JSON factura", jsonFactura);
//   if (obGlobal.bdMongo) {
//     obGlobal.bdMongo
//       .collection("facturi")
//       .insertOne(jsonFactura, function (err, rezmongo) {
//         if (err) console.log(err);
//         else console.log("Am inserat factura in mongodb");

//         obGlobal.bdMongo
//           .collection("facturi")
//           .find({})
//           .toArray(function (err, rezInserare) {
//             if (err) console.log(err);
//             else console.log(rezInserare);
//           });
//       });
//   }
// }

app.post("/cumpara", function (req, res) {
  console.log(req.body);

  if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)) {
    AccesBD.getInstanta().select(
      {
        tabel: "produse",
        campuri: ["*"],
        conditiiAnd: [`id in (${req.body.ids_prod})`],
      },
      function (err, rez) {
        if (!err && rez.rowCount > 0) {
          console.log("produse:", rez.rows);
          let rezFactura = ejs.render(
            fs.readFileSync("./views/pagini/factura.ejs").toString("utf-8"),
            {
              protocol: obGlobal.protocol,
              domeniu: obGlobal.numeDomeniu,
              utilizator: req.session.utilizator,
              produse: rez.rows,
            }
          );
          console.log(rezFactura);
          let numeFis = `./temp/factura${new Date().getTime()}.pdf`;
          genereazaPdf(rezFactura, numeFis, function (numeFis) {
            mesajText = `Stimate ${req.session.utilizator.username} aveti mai jos factura.`;
            mesajHTML = `<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos factura.`;
            req.utilizator.trimiteMail("Factura", mesajText, mesajHTML, [
              {
                filename: "factura.pdf",
                content: fs.readFileSync(numeFis),
              },
            ]);
            res.send("Totul e bine!");
          });
          // insereazaFactura(req, rez);
        }
      }
    );
  } else {
    res.send("Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!");
  }
});

// ----------- Utilizatori ------------------

app.post("/inregistrare", function (req, res) {
  var username;
  var poza;
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    if (
      !campuriText.username ||
      !campuriText.nume ||
      !campuriText.prenume ||
      !campuriText.parola ||
      !campuriText.rparola ||
      !campuriText.email
    ) {
      res.status(400).send("Primele 6 câmpuri sunt obligatorii.");
      return;
    }

    const regex = /^[A-Za-z]+(?:[-\s][A-Za-z]+)*$/;
    if (!regex.test(campuriText.nume)) {
      res.status(400).send("Numele conține caractere nepermise.");
      return;
    }
    if (!regex.test(campuriText.prenume)) {
      res.status(400).send("Prenumele conține caractere nepermise.");
      return;
    }

    //4
    console.log("Inregistrare:", campuriText);

    console.log(JSON.stringify(campuriText, null, 4));
    console.log(poza, username);
    var eroare = "";
    console.log(campuriText);
    // TO DO var utilizNou = creare utilizator
    var utilizNou = new Utilizator();
    try {
      utilizNou.setareNume = campuriText.nume[0];
      utilizNou.setareUsername = campuriText.username[0];
      utilizNou.email = campuriText.email[0];
      utilizNou.prenume = campuriText.prenume[0];

      utilizNou.parola = campuriText.parola[0];
      utilizNou.culoare_chat = campuriText.culoare_chat[0];
      utilizNou.poza = poza;
      utilizNou.data_nastere = campuriText.data_nastere[0];

      utilizNou.ocupatie = campuriText.ocupatie[0];
      Utilizator.getUtilizDupaUsername(
        campuriText.username[0],
        {},
        function (u, parametru, eroareUser) {
          if (eroareUser == -1) {
            //nu exista username-ul in BD
            //TO DO salveaza utilizator
            utilizNou.salvareUtilizator();
          } else {
            eroare += "Mai exista username-ul";
          }

          if (!eroare) {
            res.render("pagini/inregistrare", {
              raspuns: "Inregistrare cu succes!",
            });
          } else
            res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
        }
      );
    } catch (e) {
      console.log(e);
      eroare += "Eroare site; reveniti mai tarziu";
      console.log(eroare);
      res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
    }
  });
  formular.on("field", function (nume, val) {
    // 1

    console.log(`--- ${nume}=${val}`);

    if (nume == "username") username = val;
  });
  formular.on("fileBegin", function (nume, fisier) {
    //2
    console.log("fileBegin");

    console.log(nume, fisier);
    //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
    //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
    var folderUser = path.join(__dirname, "poze_uploadate", username);
    if (!fs.existsSync(folderUser)) {
      fs.mkdirSync(folderUser);
    }

    fisier.filepath = path.join(folderUser, fisier.originalFilename);
    poza = fisier.originalFilename;
    //fisier.filepath=folderUser+"/"+fisier.originalFilename
    console.log("fileBegin:", poza);
    console.log("fileBegin, fisier:", fisier);
  });
  formular.on("file", function (nume, fisier) {
    //3
    console.log("file");
    console.log(nume, fisier);
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////// Contact

app.use(["/contact"], express.urlencoded({ extended: true }));

caleXMLMesaje = "resurse/xml/contact.xml";
headerXML = `<?xml version="1.0" encoding="utf-8"?>`;
function creeazaXMlContactDacaNuExista() {
  if (!fs.existsSync(caleXMLMesaje)) {
    let initXML = {
      declaration: {
        attributes: {
          version: "1.0",
          encoding: "utf-8",
        },
      },
      elements: [
        {
          type: "element",
          name: "contact",
          elements: [
            {
              type: "element",
              name: "mesaje",
              elements: [],
            },
          ],
        },
      ],
    };
    let sirXml = xmljs.js2xml(initXML, { compact: false, spaces: 4 }); //obtin sirul xml (cu taguri)
    console.log(sirXml);
    fs.writeFileSync(caleXMLMesaje, sirXml);
    return false; //l-a creat
  }
  return true; //nu l-a creat acum
}

function parseazaMesaje() {
  let existaInainte = creeazaXMlContactDacaNuExista();
  let mesajeXml = [];
  let obJson;
  if (existaInainte) {
    let sirXML = fs.readFileSync(caleXMLMesaje, "utf8");
    obJson = xmljs.xml2js(sirXML, { compact: false, spaces: 4 });

    let elementMesaje = obJson.elements[0].elements.find(function (el) {
      return el.name == "mesaje";
    });
    let vectElementeMesaj = elementMesaje.elements
      ? elementMesaje.elements
      : []; // conditie ? val_true: val_false
    console.log(
      "Mesaje: ",
      obJson.elements[0].elements.find(function (el) {
        return el.name == "mesaje";
      })
    );
    let mesajeXml = vectElementeMesaj.filter(function (el) {
      return el.name == "mesaj";
    });
    return [obJson, elementMesaje, mesajeXml];
  }
  return [obJson, [], []];
}

app.get("/contact", function (req, res) {
  let obJson, elementMesaje, mesajeXml;
  [obJson, elementMesaje, mesajeXml] = parseazaMesaje();

  res.render("pagini/contact", {
    utilizator: req.session.utilizator,
    mesaje: mesajeXml,
  });
});

app.post("/contact", function (req, res) {
  let obJson, elementMesaje, mesajeXml;
  [obJson, elementMesaje, mesajeXml] = parseazaMesaje();

  let u = req.session.utilizator ? req.session.utilizator.username : "anonim";
  let mesajNou = {
    type: "element",
    name: "mesaj",
    attributes: {
      username: u,
      data: new Date(),
    },
    elements: [{ type: "text", text: req.body.mesaj }],
  };
  if (elementMesaje.elements) elementMesaje.elements.push(mesajNou);
  else elementMesaje.elements = [mesajNou];
  console.log(elementMesaje.elements);
  let sirXml = xmljs.js2xml(obJson, { compact: false, spaces: 4 });
  console.log("XML: ", sirXml);
  fs.writeFileSync("resurse/xml/contact.xml", sirXml);

  res.render("pagini/contact", {
    utilizator: req.session.utilizator,
    mesaje: elementMesaje.elements,
  });
});
///////////////////////////////////////////////////////
app.post("/profil", function (req, res) {
  console.log("profil");
  if (!req.session.utilizator) {
    afisareEroare(res, 403);
    res.render("pagini/eroare_generala", { text: "Nu sunteti logat." });
    return;
  }
  var formular = new formidable.IncomingForm();
  formular.uploadDir = path.join(__dirname, "uploads");
  formular.keepExtensions = true;

  formular.parse(req, function (err, campuriText, campuriFisier) {
    var parola = Array.isArray(campuriText.parola)
      ? campuriText.parola[0]
      : campuriText.parola;
    var parolaCriptata = Utilizator.criptareParola(parola);

    var campuri = [
      "nume",
      "prenume",
      "email",
      "culoare_chat",
      "data_nastere",
      "ocupatie",
    ];
    var valori = [
      campuriText.nume[0],
      campuriText.prenume[0],
      campuriText.email[0],
      campuriText.culoare_chat[0],
      campuriText.data_nastere[0],
      campuriText.ocupatie[0],
    ];

    if (campuriText.noua_parola && campuriText.noua_parola[0]) {
      var nouaParolaCriptata = Utilizator.criptareParola(
        campuriText.noua_parola[0]
      );
      campuri.push("parola");
      valori.push(nouaParolaCriptata);
    }

    if (campuriFisier.poza && campuriFisier.poza.size > 0) {
      var oldPath = campuriFisier.poza.path;
      var newPath = path.join(
        formular.uploadDir,
        req.session.utilizator.username + ".png"
      );
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
        console.log("Poza a fost încărcată cu succes");

        campuri.push("poza");
        valori.push(`uploads/${req.session.utilizator.username}.png`);

        updateDB();
      });
    } else {
      updateDB();
    }

    function updateDB() {
      AccesBD.getInstanta().updateParametrizat(
        {
          tabel: "utilizatori",
          campuri: campuri,
          valori: valori,
          conditiiAnd: [
            `parola='${parolaCriptata}'`,
            `username='${campuriText.username[0]}'`,
          ],
        },
        function (err, rez) {
          if (err) {
            console.log(err);
            afisareEroare(res, 2);
            return;
          }
          console.log(rez.rowCount);
          if (rez.rowCount == 0) {
            res.render("pagini/profil", {
              mesaj: "Update-ul nu s-a realizat. Verificati parola introdusa.",
            });
            return;
          } else {
            req.session.utilizator.nume = campuriText.nume[0];
            req.session.utilizator.prenume = campuriText.prenume[0];
            req.session.utilizator.email = campuriText.email[0];
            req.session.utilizator.culoare_chat = campuriText.culoare_chat[0];
            req.session.utilizator.data_nastere = campuriText.data_nastere[0];
            req.session.utilizator.ocupatie = campuriText.ocupatie[0];
            if (campuriText.noua_parola && campuriText.noua_parola[0]) {
              req.session.utilizator.parola = nouaParolaCriptata;
            }
            if (campuriFisier.poza && campuriFisier.poza.size > 0) {
              req.session.utilizator.poza = `poze_uploadate/${req.session.utilizator.username}/${req.session.utilizator.poza}.png`;
            }
            res.locals.utilizator = req.session.utilizator;

            res.render("pagini/profil", {
              mesaj: "Update-ul s-a realizat cu succes.",
            });
          }
        }
      );
    }
  });
});

app.post("/sterge_cont", async (req, res) => {
  var formular = new formidable.IncomingForm();

  formular.parse(req, async function (err, campuriText, campuriFisier) {
    var parolaCriptata = Utilizator.criptareParola(campuriText.parola[0]);
    console.log(campuriText.username[0]);
    console.log(parolaCriptata);
    var obiectComanda = {
      tabel: "utilizatori",
      conditiiAnd: [
        `parola='${parolaCriptata}'`,
        `username='${campuriText.username[0]}'`,
      ],
    };
    AccesBD.getInstanta().delete(obiectComanda);
  });
});

app.get("/useri", function (req, res) {
  /* TO DO
   * in if testam daca utilizatorul din sesiune are dreptul sa vizualizeze utilizatori
   * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii*/
  if (req?.utilizator.areDreptul(Drepturi.vizualizareUtilizatori)) {
    var obiectComanda = {
      tabel: "utilizatori",
      campuri: ["*"],
      conditiiAnd: [],
    };
    AccesBD.getInstanta().select(obiectComanda, function (err, rezQuery) {
      console.log(err);
      res.render("pagini/useri", { useri: rezQuery.rows });
    });
  } else {
    afisareEroare(res, 403);
  }
});

// async function f() {
//   console.log(1);
//   return 100;
// }

// async function g() {
//   rez = await f();
// }

app.post("/sterge_utiliz", function (req, res) {
  // TO DO
  //   * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
  //   * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii

  if (req?.utilizator.areDreptul(Drepturi.stergereUtilizatori)) {
    var formular = new formidable.IncomingForm();

    formular.parse(req, async function (err, campuriText, campuriFile) {
      var userId = campuriText.id_utiliz[0];
      var emailUser = await client.query(
        `SELECT email FROM utilizatori WHERE id = $1`,
        [userId]
      );

      var obiectComanda = {
        tabel: "utilizatori",
        conditiiAnd: [`id=${campuriText.id_utiliz[0]}`],
      };
      AccesBD.getInstanta().delete(
        obiectComanda,
        async function (err, rezQuery) {
          var transp = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "test.tweb.node@gmail.com",
              pass: "rwgmgkldxnarxrgu",
            },
          });

          await transp.sendMail({
            from: "test.tweb.node@gmail.com",
            to: emailUser.rows[0].email,
            subject: "De la Hypero",
            text: "Cu sinceră părere de rău, vă anunțăm că ați fost șters! Adio...",
          });
          console.log(err);
          res.redirect("useri");
        }
      );
    });
  } else {
    afisareEroare(res, 403);
  }
});

//http://${Utilizator.numeDomeniu}/confirmare/${utiliz.username}/${token}
app.get("/confirmare/:username/:token", function (req, res) {
  /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
  console.log(req.params);

  try {
    var parametriCallback = {
      req: req,
      token: req.params.token,
    };
    Utilizator.getUtilizDupaUsername(
      req.params.username,
      parametriCallback,
      function (u, obparam) {
        let parametriCerere = {
          tabel: "utilizatori",
          campuri: { confirmat_mail: true },
          conditiiAnd: [`id=${u.id}`],
        };
        AccesBD.getInstanta().update(
          parametriCerere,
          function (err, rezUpdate) {
            if (err || rezUpdate.rowCount == 0) {
              console.log("Cod:", err);
              afisareEroare(res, 3);
            } else {
              res.render("pagini/confirmare.ejs");
            }
          }
        );
      }
    );
  } catch (e) {
    console.log(e);
    afisareEroare(res, 2);
  }
});

app.post("/login", function (req, res) {
  /*TO DO parametriCallback: cu proprietatile: request(req), response(res) si parola
        testam daca parola trimisa e cea din baza de date
        testam daca a confirmat mailul
    */
  var username;
  console.log("ceva");
  var formular = new formidable.IncomingForm();

  formular.parse(req, function (err, campuriText, campuriFisier) {
    var parametriCallback = {
      req: req,
      res: res,
      parola: campuriText.parola[0],
    };
    Utilizator.getUtilizDupaUsername(
      campuriText.username[0],
      parametriCallback,
      function (u, obparam, eroare) {
        //preoceseaza utiliz
        let parolaCriptata = Utilizator.criptareParola(obparam.parola);
        if (u.parola == parolaCriptata && u.confirmat_mail) {
          u.poza = u.poza
            ? path.join("poze_uploadate", u.username, u.poza)
            : "";
          obparam.req.session.utilizator = u;
          obparam.req.session.mesajLogin = "Bravo! Te-ai logat!";
          obparam.res.redirect("/index");
        } else {
          console.log("Eroare logare");
          obparam.req.session.mesajLogin =
            "Date logare incorecte sau nu a fost confirmat mailul!";
          obparam.res.redirect("/index");
        }
      }
    );
  });
});

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      return res.status(500).send("Eroare la logout.");
    }
    res.locals.utilizator = null;
    res.redirect("/index");
  });
});

app.get("/despre", function (req, res) {
  res.render("pagini/despre", {
    ip: req.ip,
  });
});

app.get("/termeni_si_conditii", function (req, res) {
  res.render("pagini/termeni_si_conditii", {});
});

app.get("/politica_de_confidentialitate", function (req, res) {
  res.render("pagini/politica_de_confidentialitate", {});
});

app.get("/contact", function (req, res) {
  res.render("pagini/contact", {
    ip: req.ip,
  });
});

app.get("/galerie", function (req, res) {
  res.render("pagini/galerie", {
    ip: req.ip,
    imagini: obGlobal.obImagini.imagini,
  });
});
function generateRandomNumber() {
  let randomNumber;
  do {
    randomNumber = Math.floor(Math.random() * 15) + 2;
  } while ((randomNumber & (randomNumber - 1)) !== 0);
  return randomNumber;
}

const nr_imagini = generateRandomNumber();

// Read the SCSS file
const scssFilePath = path.join(__dirname, "resurse/scss/galerie-animata.scss");
let scssContent = fs.readFileSync(scssFilePath, "utf8");

// Replace the EJS statement with the value of nr_imagini
scssContent = scssContent.replace(/--nr_imagini-placeholder/g, nr_imagini);

// Compile the SCSS to CSS
const cssResult = sass.renderSync({
  data: scssContent,
  outputStyle: "expanded", // Adjust output style as needed
});

// Write the compiled CSS to a file
const cssFilePath = path.join(__dirname, "resurse/css/galerie-animata.css");
fs.writeFileSync(cssFilePath, cssResult.css);

// trimiterea unui mesaj fix
app.get("/cerere", function (req, res) {
  res.send("<b>Hello</b> <span style='color:red'>world!</span>");
});

//trimiterea unui mesaj dinamic

app.get("/data", function (req, res, next) {
  res.write("Data: ");
  next();
});
app.get("/data", function (req, res) {
  res.write("" + new Date());
  res.end();
});

/*
trimiterea unui mesaj dinamic in functie de parametri (req.params; req.query)
ce face /* si ordinea app.get-urilor.
*/
app.get("/suma/:a/:b", function (req, res) {
  var suma = parseInt(req.params.a) + parseInt(req.params.b);
  res.send("" + suma);
});

app.get("/*.ejs", function (req, res) {
  afiuareEroare(res, 400);
});

app.get(new RegExp("^/resurse/[A-Za-z0-9/]*/$/"), function (req, res) {
  afisareEroare(res, 403);
});

app.get("/favicon.ico", function (req, res) {
  res.sendFile(path.join(__dirname, "resurse/favicon/favicon.ico"));
});

app.get("/*", function (req, res) {
  console.log(req.url);
  //res.send("whatever");
  try {
    res.render("pagini" + req.url, function (err, rezHtml) {
      // console.log(rezHtml);
      // console.log("Eroare:" + err);
      // res.send(rezHtml + "");
      if (err) {
        if (err.message.startsWith("Failed to lookup view")) {
          afisareEroare(res, 404);
          console.log("Nu a gasit pagina: ", req.url);
        }
      } else {
        res.send(rezHtml + "");
      }
    });
  } catch (err1) {
    if (err1) {
      if (err1.message.startsWith("Cannot find module")) {
        afisareEroare(res, 404);
        console.log("Nu a gasit resursa: ", req.url);
      }
    } else {
      afisareEroare(res);
    }
  }
});

obGlobal = {
  obErori: null,
  obImagini: null,
  folderScss: path.join(__dirname, "resurse/scss"),
  folderCss: path.join(__dirname, "resurse/css"),
  folderBackup: path.join(__dirname, "backup"),
  optiuniMeniu: [],
  protocol: "http://",
  numeDomeniu: "localhost:8080",
  clientMongo: null,
  bdMongo: null,
};

const uri = "mongodb://localhost:27017";
obGlobal.clientMongo = new MongoClient(uri);
obGlobal.bdMongo = obGlobal.clientMongo.db("sneakers");

function initErori() {
  var continut = fs
    .readFileSync(path.join(__dirname, "resurse/json/erori.json"))
    .toString("utf-8");
  console.log(continut);

  obGlobal.obErori = JSON.parse(continut);
  for (let eroare of obGlobal.obErori.info_erori) {
    eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
  }
  obGlobal.obErori.eroare_default.imaigne = path.join(
    obGlobal.obErori.cale_baza,
    obGlobal.obErori.eroare_default.imagine
  );
  console.log(obGlobal.obErori);
}
initErori();

function initImagini() {
  var continut = fs
    .readFileSync(__dirname + "/resurse/json/galerie.json")
    .toString("utf-8");

  obGlobal.obImagini = JSON.parse(continut);
  let vImagini = obGlobal.obImagini.imagini;

  let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
  let caleAbsMediu = path.join(
    __dirname,
    obGlobal.obImagini.cale_galerie,
    "mediu"
  );
  if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);

  //for (let i=0; i< vErori.length; i++ )
  for (let imag of vImagini) {
    [numeFis, ext] = imag.fisier.split(".");
    let caleFisAbs = path.join(caleAbs, imag.fisier);
    let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
    sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
    imag.fisier_mediu = path.join(
      "/",
      obGlobal.obImagini.cale_galerie,
      "mediu",
      numeFis + ".webp"
    );
    imag.fisier = path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier);
  }
}
initImagini();

function afisareEroare(res, _identificator, _titlu, _text, _imagine) {
  let eroare = obGlobal.obErori.info_erori.find(function (elem) {
    return elem.identificator == _identificator;
  });

  if (!eroare) {
    let eroare_default = obGlobal.obErori.eroare_default;
    res.render("pagini/eroare", {
      titlu: _titlu || eroare_default.titlu,
      text: _text || eroare_default.text,
      imagine: _imagine || eroare_default.imagine,
    });
  } else {
    if (eroare.status) {
      res.status(eroare.identificator);
      res.render("pagini/eroare", {
        titlu: _titlu || eroare.titlu,
        text: _text || eroare.text,
        imagine: _imagine || eroare.imagine,
      });
    }
  }
}

function compileazaScss(caleScss, caleCss) {
  console.log("cale:", caleCss);
  if (!caleCss) {
    let numeFisExt = path.basename(caleScss);
    let numeFis = numeFisExt.split(".")[0]; /// "a.scss"  -> ["a","scss"]
    caleCss = numeFis + ".css";
  }

  if (!path.isAbsolute(caleScss))
    caleScss = path.join(obGlobal.folderScss, caleScss);
  if (!path.isAbsolute(caleCss))
    caleCss = path.join(obGlobal.folderCss, caleCss);

  let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
  if (!fs.existsSync(caleBackup)) {
    fs.mkdirSync(caleBackup, { recursive: true });
  }

  // la acest punct avem cai absolute in caleScss si  caleCss
  //TO DO
  let numeFisCss = path.basename(caleCss);
  if (fs.existsSync(caleCss)) {
    fs.copyFileSync(
      caleCss,
      path.join(obGlobal.folderBackup, "resurse/css", numeFisCss)
    ); // +(new Date()).getTime()
  }

  rez = sass.compile(caleScss, { sourceMap: true });
  fs.writeFileSync(caleCss, rez.css);
  //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
  if (path.extname(numeFis) == ".scss") {
    compileazaScss(numeFis);
  }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
  console.log(eveniment, numeFis);
  if (eveniment == "change" || eveniment == "rename") {
    let caleCompleta = path.join(obGlobal.folderScss, numeFis);
    if (fs.existsSync(caleCompleta)) {
      compileazaScss(caleCompleta);
    }
  }
});

app.listen(8080);
console.log("Serverul a pornit");
