document.addEventListener('deviceready', onDeviceReady, false);

let map;
let marker;
let infoWindow;
let photos = JSON.parse(localStorage.getItem('photos')) || []; // Load saved photos from localStorage

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    document.getElementById("getCurrentPosition").addEventListener("click", getCurrentPosition);
    document.getElementById("cameraTakePicture").addEventListener("click", cameraTakePicture);

    // Load saved photos on app startup
    loadSavedPhotos();
}

function cameraTakePicture() {
    navigator.camera.getPicture(onCameraSuccess, onCameraFail, {  
        quality: 50, 
        destinationType: Camera.DestinationType.DATA_URL 
    });
}

function onCameraSuccess(imageData) { 
    const image = document.getElementById('myImage');
    image.src = "data:image/jpeg;base64," + imageData; 
    image.style.display = 'block';

    // Get current position when photo is taken
    getCurrentPosition(function(lat, lon) {
        // Save the photo and location in localStorage
        const photoData = {
            image: imageData,
            lat: lat,
            lon: lon,
            timestamp: new Date().toISOString()
        };
        photos.push(photoData);
        localStorage.setItem('photos', JSON.stringify(photos));

        // Create a button to view all images at the current location
        const viewImagesButton = document.createElement("button");
        viewImagesButton.textContent = "View Images at this Location";
        viewImagesButton.onclick = function() {
            showImagesAtLocation(lat, lon);
        };
        
        // Append the button to the document
        document.getElementById('buttonsContainer').appendChild(viewImagesButton);

        alert('Photo saved at location: ' + lat + ', ' + lon);
    });
}

function onCameraFail(message) { 
    alert('Failed because: ' + message); 
}

function getCurrentPosition(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Initialize the map if not already initialized
            if (!map) {
                map = new google.maps.Map(document.getElementById("map"), {
                    center: { lat, lng: lon },
                    zoom: 14,
                });

                infoWindow = new google.maps.InfoWindow();
            }

            // Create a marker at the location
            if (marker) {
                marker.setMap(null);
            }
            marker = new google.maps.Marker({
                position: { lat, lng: lon },
                map: map,
                title: "You are here!"
            });

            // Get the address using Geocoder
            const geocoder = new google.maps.Geocoder();
            const latLng = new google.maps.LatLng(lat, lon);
            geocoder.geocode({ 'location': latLng }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK && results[0]) {
                    const address = results[0].formatted_address;
                    const contentString = `<div><h6>Your Location</h6><p>Address: ${address}</p></div>`;
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, marker);
                } else {alert("Geocoder failed due to: " + status);
                }
            });

            if (callback) callback(lat, lon); // Callback to save the photo with location
        }, onPositionError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function onPositionError(error) {
    alert("Unable to retrieve your location: " + error.message);
}

// Function to load saved photos and show them on the map
function loadSavedPhotos() {
    photos.forEach(photo => {
        const { lat, lon, image } = photo;

        // Create a marker for each saved photo location
        const position = new google.maps.LatLng(lat, lon);
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: "Saved Photo"
        });

        // When the marker is clicked, display the image
        google.maps.event.addListener(marker, 'click', function() {
            const contentString = `<div><h6>Saved Photo</h6><img src="data:image/jpeg;base64,${image}" alt="Photo" style="width: 200px; height: auto;"></div>`;
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
        });
    });
}

// Function to show all images at a specific location
function showImagesAtLocation(lat, lon) {
    // Filter photos that match the location
    const photosAtLocation = photos.filter(photo => photo.lat === lat && photo.lon === lon);

    if (photosAtLocation.length === 0) {
        alert("No photos found at this location.");
        return;
    }

    // Get the photo container where we will display images
    const photoContainer = document.getElementById("photoContainer");
    photoContainer.innerHTML = ""; // Clear previous images

    // Create a div with all the images for this location
    photosAtLocation.forEach(photo => {
        const imgElement = document.createElement("img");
        imgElement.src = "data:image/jpeg;base64," + photo.image;
        imgElement.alt = "Photo";
        imgElement.style.width = "200px"; // Adjust image size
        imgElement.style.height = "auto";
        imgElement.style.margin = "5px";
        
        // Append the image to the container
        photoContainer.appendChild(imgElement);
    });

    // Show the gallery
    document.getElementById("imageGallery").style.display = "block";
}

// Close the image gallery when "Close Gallery" button is clicked
document.getElementById("closeGallery").addEventListener("click", function() {
    document.getElementById("imageGallery").style.display = "none"; // Hide the gallery
});