import React, { useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  Alert,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface ImageState {
  mainImage: string | null;
  idImage: string | null;
}

export default function App(): JSX.Element {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [images, setImages] = useState<ImageState>({ mainImage: null, idImage: null });
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);

  const lastTapRef = useRef<number | null>(null);
  const idAnim = useRef(new Animated.Value(-height)).current; // start off-screen

  // Triple-tap to go back to setup
  const handleTripleTap = () => {
    setTapCount(prev => prev + 1);
    if (tapTimeout) clearTimeout(tapTimeout);
    const newTimeout = setTimeout(() => setTapCount(0), 1000);
    setTapTimeout(newTimeout);
    if (tapCount + 1 >= 3) {
      setIsSetupComplete(false);
      setTapCount(0);
      if (tapTimeout) clearTimeout(tapTimeout);
    }
  };

  // Show ID screen with drop-down animation
  const showIDScreen = () => {
    Animated.timing(idAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Hide ID screen instantly
  const hideIDScreenInstantly = () => {
    idAnim.setValue(-height);
  };

  // Double-tap on ID screen to instantly revert
  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      hideIDScreenInstantly();
    }
    lastTapRef.current = now;
  };

  // Pick image without cropping
  const pickImage = async (type: 'main' | 'id') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Access to photo library is required.', [{ text: 'OK' }]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => ({
        ...prev,
        [type === 'main' ? 'mainImage' : 'idImage']: result.assets[0].uri
      }));
    }
  };

  const takePhoto = async (type: 'main' | 'id') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Access to camera is required.', [{ text: 'OK' }]);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => ({
        ...prev,
        [type === 'main' ? 'mainImage' : 'idImage']: result.assets[0].uri
      }));
    }
  };

  const showImageOptions = (type: 'main' | 'id') => {
    if (Platform.OS === 'web') {
    // Web: skip Alert, open the file picker immediately (keeps user gesture)
    pickImage(type);
    return;
  }

    Alert.alert(
      'Select Image',
      `Choose how to add your ${type === 'main' ? 'main' : 'ID'} image:`,
      [
        { text: 'Camera', onPress: () => takePhoto(type) },
        { text: 'Photo Library', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getImageSource = (type: 'main' | 'id') => {
    const uploadedImage = type === 'main' ? images.mainImage : images.idImage;
    if (uploadedImage) return { uri: uploadedImage };
    return type === 'main'
      ? require("./assets/main_image.jpg")
      : require("./assets/id_image.jpg");
  };

  const renderSetupScreen = () => (
    <View style={styles.setupContainer}>
      <ScrollView
        style={styles.setupScrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.setupHeader}>
          <Text style={styles.setupTitle}>Welcome to IDApp</Text>
          <Text style={styles.setupSubtitle}>Customize your images to get started</Text>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>⚠️ Instructions</Text>
          <Text style={styles.disclaimerText}>
            1. Triple-tap top-left to access settings.{"\n"}
            2. Tap top-right on main screen to view ID.{"\n"}
            3. Double-tap anywhere on ID screen to return instantly to main.{"\n"}
            4. Images will appear as-is without cropping.{"\n"}
          </Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Main Screen Image</Text>
          <TouchableOpacity style={styles.imageUploadArea} onPress={() => showImageOptions('main')}>
            <Image source={getImageSource('main')} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.imageOverlay}><Text style={styles.overlayText}>📷 Tap to Change</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>ID Screen Image</Text>
          <TouchableOpacity style={styles.imageUploadArea} onPress={() => showImageOptions('id')}>
            <Image source={getImageSource('id')} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.imageOverlay}><Text style={styles.overlayText}>🆔 Tap to Change</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.okButton} onPress={() => setIsSetupComplete(true)}>
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isSetupComplete) return renderSetupScreen();

  return (
    <View style={styles.container}>
      <Image source={getImageSource('main')} style={styles.fullScreenImage} resizeMode="cover" />

      <TouchableOpacity style={styles.topRightButton} onPress={showIDScreen}>
        <View style={styles.clickArea} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.hiddenTapArea} onPress={handleTripleTap} activeOpacity={1}>
        <View style={styles.hiddenClickArea} />
      </TouchableOpacity>

      {/* Animated ID Screen */}
      <Animated.View style={[styles.idContainer, { transform: [{ translateY: idAnim }] }]}>
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <Image source={getImageSource('id')} style={styles.fullScreenImage} resizeMode="cover" />
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullScreenImage: { width: "100%", height: "100%" },

  topRightButton: { position: "absolute", top: 50, right: 20, width: 80, height: 80 },
  clickArea: { flex: 1, backgroundColor: "transparent" },

  hiddenTapArea: { position: "absolute", top: 50, left: 20, width: 80, height: 80 },
  hiddenClickArea: { flex: 1, backgroundColor: "transparent" },

  idContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 10,
  },

  setupContainer: { flex: 1, backgroundColor: "#1a1a1a" },
  setupScrollView: { flex: 1 },
  setupHeader: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  setupTitle: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: 'center' },
  setupSubtitle: { fontSize: 16, color: "#ccc", textAlign: 'center', marginTop: 5 },

  disclaimerContainer: { backgroundColor: "rgba(255,193,7,0.1)", borderLeftWidth: 4, borderLeftColor: "#FFC107", marginHorizontal: 20, marginVertical: 20, padding: 15, borderRadius: 8 },
  disclaimerTitle: { fontSize: 16, fontWeight: "bold", color: "#FFC107", marginBottom: 5 },
  disclaimerText: { fontSize: 14, color: "#fff", lineHeight: 20 },

  imageSection: { marginBottom: 40, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 15, textAlign: "center" },
  imageUploadArea: { height: 250, borderRadius: 15, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 12, alignItems: "center" },
  overlayText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  fixedButtonContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, paddingHorizontal: 20 },
  okButton: { backgroundColor: "#34C759", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, alignSelf: "center", minWidth: 120 },
  okButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: 'center' },
});
