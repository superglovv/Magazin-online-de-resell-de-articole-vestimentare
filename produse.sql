DROP TYPE IF EXISTS branduri;
DROP TYPE IF EXISTS tip_vestimentar;

CREATE TYPE branduri AS ENUM( 'Nike', 'Adidas', 'Reebok', 'Asics', 'Balenciaga', 'Louis Vuitton', 'Prada', 'Supreme', 'Bape');
CREATE TYPE tip_vestimentar AS ENUM('incaltaminte', 'imbracaminte', 'accesorii');
CREATE TYPE marimi AS ENUM('Universal','XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','42.5','43','44','45');
CREATE TYPE stil AS ENUM('Sport','Lux','Streetwear','Functional','Formal');


CREATE TABLE IF NOT EXISTS produse(
   id serial PRIMARY KEY,
   nume VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   pret_lansare INT NOT NULL CHECK (pret_lansare>=0),
   tip tip_vestimentar DEFAULT 'imbracaminte',
   brand branduri DEFAULT 'Nike',
   marime marimi DEFAULT 'Universal',
   culoare VARCHAR [], --pot sa nu fie specificare deci nu punem NOT NULL
   nou BOOLEAN NOT NULL DEFAULT TRUE,
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
   stil stiluri default 'Streetwear',
   tehnologie VARCHAR[]
);

--stil si tehnologie au fost adaugate ulterior si am facut modificari direct din pgAdmin
INSERT into produse (nume,descriere,pret,pret_lansare,tip,brand,marime,culoare,nou,imagine) VALUES 
('Dunk SB Low Travis', 'O silueta care a acaparat atentia tuturor fanilor Nike, colaborarea cu Travis Scott a ajuns clasica in doar cateva zile.', 15000.99, 900, 'incaltaminte', 'Nike', '42.5', '{BLACK,BEIGE-PETRA,BROWN}', true, 'dunksbtrav.jpg'),
('Dunk SB Low Orange Lobster', 'Aceasta silueta se alatura clasicei colectii de concepts lobsters.', 3000.00, 750, 'incaltaminte', 'Nike', '43', '{ORANGE FROST,WHITE}', true, 'dunkorangelobster.jpg'),
('Ultraboost 1.0', 'O silueta devenita iconica dupa ce a fost purtata de Ye West', 524.00, 500, 'incaltaminte', 'Adidas', '37', '{BLACK}', true, 'ultraboost1black.jpeg'),
('Nike SB Dunk Low Pro J-Pack Chicago', 'Lansat în 1985, Nike Dunk a fost un pantof de baschet bine realizat și accesibil, disponibil în designuri de tip low și high top. A fost lansat în multe variante de-a lungul anilor. În anii 2000, skateboarderii au devenit interesați de Dunks, deoarece modelul a obținut aderența extremă necesară pantofilor de skate: atât de mult încât SB Dunks sunt o parte semnificativă a produselor de Skateboarding de la Nike până în prezent. Au avut loc mai multe colaborări în anii precedenți cu participarea Supreme, Jeff Staple, Stüssy, Diamond Supply și Off-White, iar Ben and Jerry’s și Medicom au fost, de asemenea, parteneri în acest nou val.', 1200.00, 600, 'incaltaminte', 'Nike', '42', '{VARSITY RED,BLACK-WHITE}', true, 'dunkchicago.jpeg')