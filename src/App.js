import React, { useState, useEffect } from "react";
import { useReadCypher } from "use-neo4j";

const parseVal = (val) => {
  return !isNaN(val) && !isNaN(parseFloat(val)) ? val : `'${val}'`;
};

const SelectLabel = ({ onSelect }) => {
  const query = "CALL db.schema.visualization()";
  const params = {};
  const { first } = useReadCypher(query, params);

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      {first ? (
        <>
          <label htmlFor="node-labels">Select Label:</label>
          <select name="node-labels" id="node-labels" onChange={onSelect}>
            <option disabled selected value>
              ---
            </option>
            {[
              ...new Set(
                first
                  .get("nodes")
                  .map((rec) => rec.labels)
                  .flat()
              ),
            ].map((label, i) => {
              return (
                <option key={`selectLabel-${label}-${i}`} value={label}>
                  {label}
                </option>
              );
            })}
          </select>
        </>
      ) : (
        "Loading Node Labels..."
      )}
    </div>
  );
};

const SetPropertyValues = ({ label, onReadSubmit }) => {
  const [propertyValues, setPropertyValues] = useState({});
  const [disabled, setDisabled] = useState(false);

  const query = `
    CALL db.schema.nodeTypeProperties()
    YIELD nodeLabels, propertyName, propertyTypes
    WHERE $label IN nodeLabels
    RETURN DISTINCT propertyName, propertyTypes
  `;
  const params = { label };
  const { records } = useReadCypher(query, params);

  const handleSubmit = (event) => {
    event.preventDefault();
    onReadSubmit(
      propertyValues,
      records.map((rec) => rec.get("propertyName"))
    );
    setDisabled(true);
  };

  const handleChange = (event) => {
    setPropertyValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "1rem" }}>
      {records ? (
        <>
          {records.map((rec, i) => {
            const property = rec.get("propertyName");
            return (
              <div
                key={`setPropertyValues-${property}-${i}`}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>{property}</div>
                <input
                  type="text"
                  id={`property-${i}`}
                  name={property}
                  value={
                    propertyValues[property] ? propertyValues[property] : ""
                  }
                  onChange={handleChange}
                  disabled={disabled}
                ></input>
              </div>
            );
          })}
          <input type="submit" value="Fetch Result Set" disabled={disabled} />
        </>
      ) : (
        `Loading ${label} Properties`
      )}
    </form>
  );
};

const WriteProperties = ({ writableProperties, onWriteSubmit }) => {
  const [writeProperties, setWriteProperties] = useState({});

  const handleChange = (event) => {
    setWriteProperties((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onWriteSubmit(writeProperties);
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "1rem" }}>
      {writableProperties.map((property, i) => {
        return (
          <div
            key={`writable-${i}`}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div>{property}</div>
            <input
              type="text"
              id={`property-${i}`}
              name={property}
              value={writeProperties[property] ? writeProperties[property] : ""}
              onChange={handleChange}
            ></input>
          </div>
        );
      })}
      <input type="submit" value="Write to DB!" />
    </form>
  );
};

const App = ({ driver }) => {
  const [label, setLabel] = useState(null);
  const [writableProperties, setWritableProperties] = useState(null);
  const [readQuery, setReadQuery] = useState(null);
  const [writeQuery, setWriteQuery] = useState(null);

  const handleSelect = (event) => {
    setLabel(event.target.value);
  };

  const handleReadSubmit = (propertyValues, labelProperties) => {
    setWritableProperties(labelProperties);
    const wheres = Object.entries(propertyValues).map(([key, val]) => {
      return `n.${key} = ${parseVal(val)}`;
    });
    const query = `MATCH (n:${label}) WHERE ${wheres.join(
      " AND "
    )} WITH collect(id(n)) AS nodeIds`;
    setReadQuery(query);
  };

  const handleWriteSubmit = (writeProperties) => {
    const sets = Object.entries(writeProperties).map(([key, val]) => {
      return `n.${key} = ${parseVal(val)}`;
    });
    const query = `${readQuery} UNWIND nodeIds AS nodeId MATCH (n) WHERE id(n) = nodeId SET ${sets.join(
      ", "
    )}`;
    setWriteQuery(query);
  };

  useEffect(() => {
    if (writeQuery) {
      let session = driver.session();
      session.run(writeQuery).then(() => {
        session.close();
      });
    }
  }, [writeQuery]);

  return (
    <div
      id="App"
      style={{ padding: "2rem", width: `${window.innerWidth * 0.33}px` }}
    >
      <h1>Dashboard</h1>
      <SelectLabel onSelect={handleSelect} />
      {label ? (
        <SetPropertyValues label={label} onReadSubmit={handleReadSubmit} />
      ) : null}
      {readQuery ? (
        <WriteProperties
          writableProperties={writableProperties}
          onWriteSubmit={handleWriteSubmit}
        />
      ) : null}
    </div>
  );
};

export default App;
