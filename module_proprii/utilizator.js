const AccesBD = require("./accesbd.js");
const parole = require("./parole.js");

const { RolFactory } = require("./roluri.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

class Utilizator {
  /**
   * Tipul conexiunii la bază de date.
   * @type {string}
   * @static
   */
  static tipConexiune = "local";
  /**
   * Numele tabelului pentru utilizatori în baza de date.
   * @type {string}
   * @static
   */
  static tabel = "utilizatori";
  /**
   * Parola folosită pentru criptarea parolelor.
   * @type {string}
   * @static
   */
  static parolaCriptare = "tehniciweb";
  /**
   * Adresa serverului de email.
   * @type {string}
   * @static
   */
  static emailServer = "test.tweb.node@gmail.com";
  /**
   * Lungimea codului de criptare.
   * @type {number}
   * @static
   */
  static lungimeCod = 64;
  /**
   * Numele de domeniu utilizat pentru linkurile din emailuri.
   * @type {string}
   * @static
   */
  static numeDomeniu = "localhost:8080";
  /**
   * Eroare internă.
   * @type {string}
   * @private
   */
  #eroare;

  /**
   * Constructor pentru clasa Utilizator.
   * @param {object} parametri - Parametrii utilizatorului.
   * @param {number} parametri.id - ID-ul utilizatorului.
   * @param {string} parametri.username - Username-ul utilizatorului.
   * @param {string} parametri.nume - Numele utilizatorului.
   * @param {string} parametri.prenume - Prenumele utilizatorului.
   * @param {string} parametri.email - Adresa de email a utilizatorului.
   * @param {string} parametri.parola - Parola utilizatorului.
   * @param {object} parametri.rol - Rolul utilizatorului.
   * @param {string} [parametri.culoare_chat="black"] - Culoarea chat-ului.
   * @param {string} parametri.poza - Poza utilizatorului.
   * * @param {string} parametri.data_nastere - Data nasterii utilizatorului.
   * * @param {string} parametri.ocupatie - Ocupatia utilizatorului.
   */
  constructor({
    id,
    username,
    nume,
    prenume,
    email,
    parola,
    rol,
    culoare_chat = "black",
    poza,
    data_nastere,
    ocupatie,
  } = {}) {
    this.id = id;
    //optional sa facem asta in constructor
    try {
      if (this.checkUsername(username)) this.username = username;
      else throw new Error("Username Incorrect!");
    } catch (e) {
      this.#eroare = e.message;
    }

    for (let prop in arguments[0]) {
      this[prop] = arguments[0][prop];
    }
    if (this.rol)
      this.rol = this.rol.cod
        ? RolFactory.creeazaRol(this.rol.cod)
        : RolFactory.creeazaRol(this.rol);
    console.log(this.rol);

    this.#eroare = "";
  }

  /**
   * Verifică dacă numele este valid.
   * @param {string} nume - Numele de verificat.
   * @returns {boolean} - `true` dacă numele este valid, `false` altfel.
   */
  checkName(nume) {
    return (
      nume != "" && nume.match(new RegExp("^[A-Za-z]+(?:[-s][A-Za-z]+)*$"))
    );
  }

  /**
   * Setează numele utilizatorului.
   * @param {string} nume - Numele de setat.
   */
  set setareNume(nume) {
    if (this.checkName(nume)) this.nume = nume;
    else {
      throw new Error("Nume gresit");
    }
  }

  /*
   * folosit doar la inregistrare si modificare profil
   */
  /**
   * Setează username-ul utilizatorului.
   * @param {string} username - Username-ul de setat.
   */
  set setareUsername(username) {
    if (this.checkUsername(username)) this.username = username;
    else {
      throw new Error("Username gresit");
    }
  }

  /**
   * Verifică dacă username-ul este valid.
   * @param {string} username - Username-ul de verificat.
   * @returns {boolean} - `true` dacă username-ul este valid, `false` altfel.
   */
  checkUsername(username) {
    return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
  }

  /**
   * Criptează parola utilizatorului.
   * @param {string} parola - Parola de criptat.
   * @returns {string} - Parola criptată.
   * @static
   */
  static criptareParola(parola) {
    return crypto
      .scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod)
      .toString("hex");
  }

  /**
   * Salvează datele utilizatorului în baza de date și trimite un email de confirmare.
   *
   * @throws {Error} Aruncă o eroare dacă apare o problemă la salvarea sau trimiterea emailului.
   */
  salvareUtilizator() {
    let parolaCriptata = Utilizator.criptareParola(this.parola);
    let utiliz = this;
    let token =
      parole.genereazaToken(4) +
      Utilizator.criptareParola(utiliz.username, utiliz.domeniu).replace(
        /[^0-9a-zA-Z]/g,
        "0"
      );
    AccesBD.getInstanta(Utilizator.tipConexiune).insert(
      {
        tabel: Utilizator.tabel,
        campuri: {
          username: this.username,
          nume: this.nume,
          prenume: this.prenume,
          parola: parolaCriptata,
          email: this.email,
          culoare_chat: this.culoare_chat,
          cod: token,
          poza: this.poza,
          data_nastere: this.data_nastere,
          ocupatie: this.ocupatie,
        },
      },
      function (err, rez) {
        if (err) console.log(err);
        else
          utiliz.trimiteMail(
            "Cont nou",
            "Bine ai venit in comunitatea Hypero. Username-ul tau este " +
              utiliz.username,
            `<h1>Bine ai venit in comunitatea Hypero.</h1><p style='color:blue'>Username-ul tau este <span style="color: green;"><strong>${utiliz.username}</strong></span>.</p> <p><a href='http://${Utilizator.numeDomeniu}/confirmare/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`
          );
      }
    );
  }

  /**
   * Trimite un email utilizatorului.
   * @param {string} subiect - Subiectul email-ului.
   * @param {string} mesajText - Mesajul text al email-ului.
   * @param {string}
   * */

  //xjxwhotvuuturmqm

  async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
    var transp = nodemailer.createTransport({
      service: "gmail",
      secure: false,
      auth: {
        //date login
        user: Utilizator.emailServer,
        pass: "rwgmgkldxnarxrgu",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    //genereaza html
    await transp.sendMail({
      from: Utilizator.emailServer,
      to: this.email, //TO DO
      subject: subiect, //"Te-ai inregistrat cu succes",
      text: mesajText, //"Username-ul tau este "+username
      html: mesajHtml, // `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
      attachments: atasamente,
    });
    console.log("trimis mail");
  }

  /**
   * Caută un utilizator în baza de date după numele de utilizator dat și returnează o promisiune.
   *
   * @param {string} username - Numele de utilizator căutat.
   * @returns {Promise<Utilizator|null>} - Returnează o promisiune care se rezolvă cu un obiect Utilizator dacă utilizatorul este găsit, sau cu null altfel.
   */
  static async getUtilizDupaUsernameAsync(username) {
    if (!username) return null;
    try {
      let rezSelect = await AccesBD.getInstanta(
        Utilizator.tipConexiune
      ).selectAsync({
        tabel: "utilizatori",
        campuri: ["*"],
        conditiiAnd: [`username='${username}'`],
      });
      if (rezSelect.rowCount != 0) {
        return new Utilizator(rezSelect.rows[0]);
      } else {
        console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
        return null;
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  /**
   * Caută un utilizator în baza de date după numele de utilizator dat și apelează o funcție de procesare.
   *
   * @param {string} username - Numele de utilizator căutat.
   * @param {Object} obparam - Un obiect care poate fi utilizat în procesarea utilizatorului găsit.
   * @param {function(Utilizator, Object, number)} proceseazaUtiliz - Funcția de procesare care primește utilizatorul găsit, obiectul parametru și un cod de eroare.
   * @returns {void} - Nu returnează nimic; procesul este asincron.
   */
  static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
    if (!username) return null;
    let eroare = null;
    AccesBD.getInstanta(Utilizator.tipConexiune).select(
      {
        tabel: "utilizatori",
        campuri: ["*"],
        conditiiAnd: [`username='${username}'`],
      },
      function (err, rezSelect) {
        if (err) {
          console.error("Utilizator:", err);
          //throw new Error()
          eroare = -2;
        } else if (rezSelect.rowCount == 0) {
          eroare = -1;
        }
        //constructor({id, username, nume, prenume, email, rol, culoare_chat="black", poza}={})
        let u = new Utilizator(rezSelect.rows[0]);
        proceseazaUtiliz(u, obparam, eroare);
      }
    );
  }
  /**
   * Verifică dacă utilizatorul are un anumit drept.
   *
   * @param {string} drept - Numele dreptului pe care se face verificarea.
   * @returns {boolean} - Returnează true dacă utilizatorul are dreptul specificat, sau false altfel.
   */
  areDreptul(drept) {
    return this.rol.areDreptul(drept);
  }
}
module.exports = { Utilizator: Utilizator };
