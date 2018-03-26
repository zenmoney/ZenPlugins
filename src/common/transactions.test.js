import {mapObjectsGroupedByKey} from "./transactions";

describe("mapObjectsGroupedByKey", () => {
    it("groups by key", () => {
        const groupMapper = jest.fn();
        mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
                object => object.key,
                groupMapper);
        expect(groupMapper).toHaveBeenCalledTimes(2);
        expect(groupMapper).toHaveBeenCalledWith([{id: "1", key: 1}, {id: "3", key: 1}], 1);
        expect(groupMapper).toHaveBeenCalledWith([{id: "2", key: 2}, {id: "4", key: 2}], 2);
    });

    it("maps groups", () => {
        const result = mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
            object => object.key,
            group  => group[0].id);
        expect(result).toEqual(["1", "2"]);
    });

    it("filters empty groups", () => {
        const result = mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
            object => object.key,
            group  => group[0].id === "1" ? group : null);
        expect(result).toEqual([{id: "1", key: 1}, {id: "3", key: 1}]);
    });
});
