/*
Middleware = <Args: Array, T: (...args: Args) => any>(next: T) => T
       aka   <Args: Array>Transform<(...args: Args) => any>

Dit is sowieso waar want als het niet zo was dan zouden de middlewares niet
zomaar verwisselt van volgorde of verwijderd en toegevoegd kunnen worden.
Neem bijboorbeeld:

f :: (value: number) => string
g :: (value: string => Date

als applied  g(f(3)) zou het zijn `number => string => Date` zijn, maar
gebruikt als f(g(3)) zou het worden `string => Date | number => string`,
Hele type anders en zou ook niet eens geldig zijn omdat het `Date` krijgt
waar het number verwacht!
*/

/*
Middeware kan je het best zo breed mogelijk om het object wat maken wat je
wilt wrappen. Als ik hier nog dingen tegen bedenk schrijf ik ze hier op
zodat ik ze kan onthouden:

Q. Hoe kan je dit om een store heen plaatsen als de store geen functie is?
A. Niet, je plaatst het om de store creator heen.

Q. Is het wrappen van de store niet onhandig?
A. Ik bedacht net een reden (iets met dat niet alle events langs komen)
   moet even kijken of dat morgen ook nog hold hmmm


FOUT FOUT FOUT FOUT
Middleware returned altijd een functie, en de functie in die middleware
returned altijd iets dat per middleware kan verschillen. De functie die je
als laatste toepast op de middleware (of gecombineerde middleware) heeft
dus vooral GEEN RETURN VALUE! Het is een soort even handler die een event
dat door alle middelware heen gereist is opvangt en toepast. Iets dat ik
niet had bedacht is dat die laatste functie impure moet zijn, want anders
kan je niets doen met de data. Als gevolg is het callen van die functie
dus ook een impure actie, waardoor middleware gelijkt per definitie ook
... impure moet zijn 🤔

Wat ik door de war haal is misschien waarom redux ook reducers en middleware
gescheiden heeft: reducers zijn pure, middleware impure. (Ik heb die soort
van samengevoegd in middleware)
*/

/* !!!!!!!!!!!!!!!!!                    !!!!!!!!!!!!!!!!
  Wat als je, in plaats van alleen aan de data, bij een subscription ook
  een lijstje krijgt me events (mutations alleen?) die bij die data geholpen
  hebben? Dat maakt het makkelijker om transacties over te communiceren, zonder
  daar het medium voor aan te passen, en maakt de meeste middleware tot
  simple 'attach' functies die zich aan de functie binde

   !!!!!!!!!!!!!!!!!                    !!!!!!!!!!!!!!!!! */
