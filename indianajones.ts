import fs from 'fs/promises';
import moment, { Moment } from 'moment';

interface IResult {
    travelTime: string,
    arrival: null | string,
    paths: [Itineraire]
}


export class Voyage {
    #heureDepartVoyage: Moment;
    #villeDepartVoyage: string;
    #villeArriveVoyage: string;
    #itineraires: Itineraire[];
    possiblePaths: any[] = [];
    results: IResult[] = [];
    fastest: IResult;

    constructor([heureDepartVoyage, villeDepartVoyage, villeArriveVoyage]: string[], itineraires?: Itineraire[]) {
        if(!heureDepartVoyage || !villeDepartVoyage || !villeArriveVoyage || itineraires.length == 0) {
            throw new Error("Wrong or Missing parameter");
        }

        this.heureDepartVoyage = moment(heureDepartVoyage, "HH:mm").utc(true);
        this.villeDepartVoyage = villeDepartVoyage;
        this.villeArriveVoyage = villeArriveVoyage;
        this.itineraires = itineraires;
    }

    get heureDepartVoyage (): Moment {return this.#heureDepartVoyage};
    set heureDepartVoyage (heureDepartVoyage: Moment) {this.#heureDepartVoyage = heureDepartVoyage};

    get villeDepartVoyage (): string {return this.#villeDepartVoyage};
    set villeDepartVoyage (villeDepartVoyage: string) {this.#villeDepartVoyage = villeDepartVoyage};

    get villeArriveVoyage (): string {return this.#villeArriveVoyage};
    set villeArriveVoyage (villeArriveVoyage: string) {this.#villeArriveVoyage = villeArriveVoyage};

    get itineraires (): Itineraire[] {return this.#itineraires};
    set itineraires (itineraires: Itineraire[]) {this.#itineraires = itineraires};

    calculDifferentPossibilite (villeDepart?: string, pathCache?: any) {
        let firstItineraires = this.getItineraireByCity(villeDepart || this.villeDepartVoyage);

        firstItineraires.forEach((itineraire) => {
            let path = pathCache && [...pathCache] || [];
           
            path.push(itineraire);

            if(itineraire.villeArrivee === this.#villeArriveVoyage) {
                this.possiblePaths.push([...path]);
            }else {
                this.calculDifferentPossibilite(itineraire.villeArrivee, path);
            }
        });
    }

    calculFastestPath () {
        this.possiblePaths.forEach((paths) => {
            let pathTime = this.#heureDepartVoyage;
            let isPossible = true;

            paths.forEach(path => {
                if(pathTime.diff(path.horaireDepart) < 0) {
                    pathTime = path.horaireDepart;
                    pathTime.add(path.dureeTrajet);
                } else {
                    this.results.push({'travelTime': 'Chemin Impossible', 'arrival': null, paths});
                    isPossible = false;
                }
            });
            
            if(isPossible) {
                let travelTime = this.getTravelTime(this.#heureDepartVoyage, pathTime)
                let result = {travelTime, arrival: pathTime.format('HH:mm'), paths}

                this.results.push(result);

                if(!this.fastest || this.fastest.travelTime > result.travelTime) {
                    this.fastest = result
                }
            }
        });
    }

    displayFastest () {
        console.log(`The fastest travel is : \r\n ${this.fastest.paths.map((e: Itineraire) => e.toString())} \r\n For ${this.fastest.travelTime} Hours, Arrival at ${this.fastest.arrival}`);
    }

    getTravelTime(timeStart: Moment, timeEnd: Moment): string {
        return moment.duration(timeEnd.diff(timeStart)).asHours().toFixed();
    }

    getItineraireByCity (villeDepart: string): Itineraire[] {
        return this.#itineraires.filter((e) => e.villeDepart === villeDepart);
    }
}

export class Itineraire {
    #horaireDepart: Moment;
    #villeDepart: string;
    #villeArrivee: string;
    #dureeTrajet: string;

    constructor([horaireDepart, villeDepart, villeArrivee, dureeTrajet]: string[]) {
        if(!horaireDepart || !villeDepart || !villeArrivee || !dureeTrajet) {
            throw new Error("Wrong or Missing parameter");
        }

        this.#horaireDepart = moment(horaireDepart, "HH:mm").utc(true);
        this.#villeDepart = villeDepart;
        this.#villeArrivee = villeArrivee;
        this.#dureeTrajet = dureeTrajet;
    }

    get horaireDepart (): Moment {return this.#horaireDepart};
    set horaireDepart (horaireDepart: Moment) {this.#horaireDepart = horaireDepart};

    get villeDepart (): string {return this.#villeDepart};
    set villeDepart (villeDepart: string) {this.#villeDepart = villeDepart};

    get villeArrivee (): string {return this.#villeArrivee};
    set villeArrivee (villeArrivee: string) {this.#villeArrivee = villeArrivee};

    get dureeTrajet (): string {return this.#dureeTrajet};
    set dureeTrajet (dureeTrajet: string) {this.#dureeTrajet = dureeTrajet};


    toString () {
        return `${this.villeDepart} - ${this.villeArrivee}`;
    }
}

export class DataReader {
    rawdata: any;
    dataByLine: string[];

    constructor (rawData: any) {
        this.rawdata = rawData;
        this.dataByLine = this.rawdata.split('\r\n');
    }

    getFullRawData () {
        return this.rawdata;
    }

    getVoyageFromData () {
        return this.dataByLine[0].split(';');
    }

    getItinerairesFromData () {
        return this.dataByLine.slice(2).map((element: string) => element.split(';'));
    }
}

export class TextDataReader extends DataReader {

    constructor (rawData: any) {
        super(rawData);
    }

    static async build(filePath: string): Promise<TextDataReader> {
        let rawData = await fs.readFile(filePath, 'utf-8');

        return new TextDataReader(rawData)
    }
}

export const start = async () => {
    const datareader = await TextDataReader.build('./donnees.txt');
    const voyageData = datareader.getVoyageFromData();
    const itinerairesList = datareader.getItinerairesFromData().map((itineraire) => new Itineraire(itineraire));

    const voyage = new Voyage(voyageData, itinerairesList);
    voyage.calculDifferentPossibilite();
    voyage.calculFastestPath();
    voyage.displayFastest();
}