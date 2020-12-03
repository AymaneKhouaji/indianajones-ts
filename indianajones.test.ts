
// TEST CLASS
import { DataReader, Itineraire, TextDataReader, Voyage } from "./indianajones";
import { mocked } from 'ts-jest/utils';
import fs from 'fs/promises';
import moment from "moment";

jest.mock('fs/promises');

describe("Test Itineraire class", () => {
    test("doesn't throw error when constructed correctly", async () => {
        expect(() => {
            const testItineraire = new Itineraire(["09:30", "Paris", "Bruxelle", "01h30"]);
        }).not.toThrowError();
    });

    test("throw error when constructed incorrectly", async () => {
        expect(() => {
            const testItineraire = new Itineraire(["Paris", "Bruxelle", "01h30"]);
        }).toThrowError();
    });


    test("toString function should return villeDepart - villeArrivee", async () => {
        const testItineraire = new Itineraire(["09:30", "Paris", "Bruxelle", "01h30"]);

        expect(testItineraire.toString()).toBe('Paris - Bruxelle')
    });
});

describe("Test Voyage class", () => {
    test("throw error when constructed incorrectly", async () => {
        expect(() => {
            const testVoyage = new Voyage(["Paris", "Bruxelle", "01h30"], []);
        }).toThrowError();
    });

    test("should get the correct different path", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["12:30","Amsterdam","Berlin","06:10"],
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        testVoyage.calculDifferentPossibilite();

        expect(testVoyage.possiblePaths).toHaveLength(1);
    });

    test("should not get the correct different path", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["12:30","Amsterdam","Munich","06:10"],
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        testVoyage.calculDifferentPossibilite();

        expect(testVoyage.possiblePaths).toHaveLength(0);
    });

    test("should find the fastest path", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["08:30", "Paris", "Bruxelles", "01:20"],
            ["10:00", "Bruxelles", "Amsterdam", "02:10"],
            ["12:30", "Amsterdam", "Berlin", "06:10"],
            ["11:30", "Bruxelles", "Berlin", "09:20"]
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        testVoyage.calculDifferentPossibilite();
        testVoyage.calculFastestPath();

        expect(testVoyage.results).toHaveLength(3);
        expect(testVoyage.fastest.arrival).toEqual("18:40");
    });

    test("should get the itineraire by city", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["12:30","Amsterdam","Munich","06:10"],
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        expect(testVoyage.getTravelTime(moment("08h00", "HH:mm"), moment("12h00", "HH:mm"))).toEqual("4");
    });


    test("should get the itineraire by city", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["12:30","Amsterdam","Munich","06:10"],
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        expect(testVoyage.getItineraireByCity('Paris')).toHaveLength(1);
    });

    test("should return empty array if city not found", async () => {
        let voyage = ["08h20", "Paris", "Berlin"];

        let itineraires = [
            ["09:20", "Paris", "Amsterdam", "03:20"],
            ["12:30","Amsterdam","Munich","06:10"],
        ].map((e) => new Itineraire(e));

        const testVoyage = new Voyage(voyage, itineraires);

        expect(testVoyage.getItineraireByCity('Madrid')).toHaveLength(0);
    });
});

describe("Test DataReader class", () => {
    test("should return full raw data when getFullRaxData is called", () => {
        let datareader = new DataReader('test');

        expect(datareader.getFullRawData()).toEqual('test');
    });

    test("should return the voyage data when getVoyageFromData is called", () => {
        let datareader = new DataReader('08:20;Paris;Berlin\r\n5\r\n09:20;Paris;Amsterdam;03:20');

        expect(datareader.getVoyageFromData()).toEqual(["08:20", "Paris", "Berlin"]);
    });

    test("should return the Itineraires data when getItinerairesFromData is called", () => {
        let datareader = new DataReader('08:20;Paris;Berlin\r\n5\r\n09:20;Paris;Amsterdam;03:20');

        expect(datareader.getItinerairesFromData()).toEqual([["09:20", "Paris", "Amsterdam", "03:20"]]);
    });
});

describe("Test TextDataReader class", () => {
    let fsmock;

    beforeEach(() => {
        fsmock = mocked(fs, true);

        fsmock.readFile.mockImplementation((): Promise<string | Buffer> => {
            return Promise.resolve('test');
        })
    })

    test("should call fs.readFile with correct parameter", async () => {
        let textDataReader = TextDataReader.build('./test');

        expect(fsmock.readFile.mock.calls).toHaveLength(1);
        expect(fsmock.readFile.mock.calls[0]).toEqual(['./test', 'utf-8'])
    });

    test("should return a Instanciate class with rawData", async () => {
        let textDataReader = TextDataReader.build('./test');

        expect((await textDataReader).rawdata).toBe('test');
    });
});