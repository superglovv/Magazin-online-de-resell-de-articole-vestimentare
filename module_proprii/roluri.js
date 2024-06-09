const Drepturi = require("./drepturi.js");

class Rol {
  /**
   * @returns {Symbol[]} Lista cu drepturile rolului.
   */
  static get tip() {
    return "generic";
  }
  static get drepturi() {
    return [];
  }
  constructor() {
    this.cod = this.constructor.tip;
  }

  /**
   * @param {Symbol} drept
   * @returns boolean
   */
  areDreptul(drept) {
    //drept trebuie sa fie tot Symbol
    console.log("in metoda rol!!!!");
    return this.constructor.drepturi.includes(drept); //pentru ca e admin
  }
}

class RolAdmin extends Rol {
  /**
   * Returnează tipul rolului.
   * @static
   * @returns {string} - Tipul rolului ("admin").
   */
  static get tip() {
    return "admin";
  }
  constructor() {
    super();
  }

  areDreptul() {
    return true; //pentru ca e admin
  }
}

class RolModerator extends Rol {
  /**
   * Returnează tipul rolului.
   * @static
   * @returns {string} - Tipul rolului ("moderator").
   */
  static get tip() {
    return "moderator";
  }
  static get drepturi() {
    return [Drepturi.vizualizareUtilizatori, Drepturi.stergereUtilizatori];
  }
  constructor() {
    super();
  }
}

class RolClient extends Rol {
  /**
   * Returnează tipul rolului.
   * @static
   * @returns {string} - Tipul rolului ("comun").
   */
  static get tip() {
    return "comun";
  }
  static get drepturi() {
    return [Drepturi.cumparareProduse];
  }
  constructor() {
    super();
  }
}

class RolFactory {
  /**
   * @param {string} tip
   * @returns {Rol | null}
   */
  static creeazaRol(tip) {
    switch (tip) {
      case RolAdmin.tip:
        return new RolAdmin();
      case RolModerator.tip:
        return new RolModerator();
      case RolClient.tip:
        return new RolClient();
    }
  }
}

module.exports = {
  RolFactory: RolFactory,
  RolAdmin: RolAdmin,
};
