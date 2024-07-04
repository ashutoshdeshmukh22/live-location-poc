import { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "./App.css";

const ENDPOINT = "http://localhost:3000";

function App() {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [otherLocations, setOtherLocations] = useState([]);
  const [newUserAlert, setNewUserAlert] = useState(null);

  const customOtherLocations = {
    client1: { latitude: 52.52, longitude: 13.405 },
    client2: { latitude: 48.8566, longitude: 2.3522 },
    client3: { latitude: 34.0522, longitude: -118.2437 },
  };

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    // Request user's location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          socket.emit("sendLocation", { latitude, longitude });
        },
        (error) => {
          console.error("Error fetching location: ", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }

    // Listen for location updates from other clients
    socket.on("updateLocation", (locationData) => {
      setOtherLocations((prevLocations) => ({
        ...prevLocations,
        [locationData.id]: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      }));
    });

    // Listen for client disconnections
    socket.on("removeLocation", (locationData) => {
      setOtherLocations((prevLocations) => {
        const updatedLocations = { ...prevLocations };
        delete updatedLocations[locationData.id];
        return updatedLocations;
      });
    });

    // Listen for new user alert
    socket.on("newUserAlert", (data) => {
      setNewUserAlert(data.message);
      setTimeout(() => {
        setNewUserAlert(null);
      }, 3000); // Hide alert after 3 seconds
    });

    // Clean up on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      {newUserAlert && (
        <div className="alert">
          <p>{newUserAlert}</p>
        </div>
      )}

      {location.latitude && location.longitude ? (
        <MapContainer
          className="markercluster-map"
          center={[location.latitude, location.longitude]}
          zoom={13}
          maxZoom={18}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="Ashutosh Deshmukh"
          />

          <Marker position={[location.latitude, location.longitude]}>
            <Tooltip>Im here</Tooltip>
          </Marker>

          {/* Render markers for customOtherLocations */}
          {Object.keys(customOtherLocations).map((key) => (
            <Marker
              key={key}
              position={[
                customOtherLocations[key].latitude,
                customOtherLocations[key].longitude,
              ]}
            >
              <Popup>
                <p>Test User Location {key}</p>
              </Popup>
            </Marker>
          ))}

          {/* Render markers for otherLocations socket */}
          {Object.keys(otherLocations).map((key) => (
            <Marker
              key={key}
              position={[
                otherLocations[key].latitude,
                otherLocations[key].longitude,
              ]}
            >
              <Popup>
                <p>Other User Location</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <p>Loading map...</p>
      )}
    </div>
  );
}

export default App;
