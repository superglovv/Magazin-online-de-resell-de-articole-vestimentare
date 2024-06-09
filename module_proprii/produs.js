// class Produs{

//     constructor({id, nume, descriere, pret, gramaj, tip_produs, calorii, categorie, ingrediente, pt_diabetici, imagine, data_adaugare}={}) {

//         for(let prop in arguments[0]){
//             this[prop]=arguments[0][prop]
//         }

//     }

// }

class Produs {
  /**
   * Constructor pentru clasa Produs.
   * @constructor
   * @param {Object} [options={}] - Opțiuni pentru crearea produsului.
   * @param {number} [options.id] - ID-ul produsului.
   * @param {string} [options.nume] - Numele produsului.
   * @param {string} [options.descriere] - Descrierea produsului.
   * @param {number} [options.pret] - Prețul produsului.
   * @param {number} [options.pret_lansare] - Prețul de lansare al produsului.
   * @param {string} [options.tip] - Tipul produsului.
   * @param {string} [options.brand] - Brand-ul produsului.
   * @param {string} [options.marime] - Mărimea produsului.
   * @param {string} [options.culoare] - Culoarea produsului.
   * @param {boolean} [options.nou] - Indicator pentru produs nou sau nu.
   * @param {string} [options.imagine] - Calea către imaginea produsului.
   * @param {Date} [options.data_adaugare] - Data de adăugare a produsului.
   * @param {string} [options.stil] - Stilul produsului.
   * @param {string} [options.tehnologie] - Tehnologia produsului.
   */
  constructor({
    id,
    nume,
    descriere,
    pret,
    pret_lansare,
    tip,
    brand,
    marime,
    culoare,
    nou,
    imagine,
    data_adaugare,
    stil,
    tehnologie,
  } = {}) {
    for (let prop in arguments[0]) {
      this[prop] = arguments[0][prop];
    }
  }
}
