CREATE TABLE seturi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nume_set VARCHAR(100),
    descriere_set TEXT
);

CREATE TABLE asociere_set (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_set INT,
    id_produs INT,
    FOREIGN KEY (id_set) REFERENCES seturi(id),
    FOREIGN KEY (id_produs) REFERENCES produse(id)
);
