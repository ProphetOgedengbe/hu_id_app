import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from "react-native";

export default function App(): JSX.Element {
  const [showID, setShowID] = useState(false);

  let lastTap: number | null = null;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      setShowID(false); // go back to main screen
    }
    lastTap = now;
  };

  return (
    <View style={styles.container}>
      {!showID ? (
        <>
          <Image
            source={require("./assets/main_image.jpg")}
            style={styles.fullScreenImage}
          />
          <TouchableOpacity
            style={styles.topRightButton}
            onPress={() => setShowID(true)}
          >
            <View style={styles.clickArea} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <Image
            source={require("./assets/id_image.jpg")}
            style={styles.fullScreenImage}
          />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topRightButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 80,
    height: 80,
  },
  clickArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
