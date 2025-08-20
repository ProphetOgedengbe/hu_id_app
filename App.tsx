import React, { useState } from "react";
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  TouchableWithoutFeedback,
  Text,
  Alert,
  ScrollView,
  Dimensions
} from "react-native";
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface ImageState {
  mainImage: string | null;
  idImage: string | null;
}

export default function App(): JSX.Element {
  const [showID, setShowID] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [images, setImages] = useState<ImageState>({
    mainImage: null,
    idImage: null
  });
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);

  let lastTap: number | null = null;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      setShowID(false);
    }
    lastTap = now;
  };

  const handleTripleTap = () => {
    setTapCount(prev => prev + 1);
    if (tapTimeout) clearTimeout(tapTimeout);

    const newTimeout = setTimeout(() => {
      setTapCount(0);
    }, 1000);

    setTapTimeout(newTimeout);

    if (tapCount + 1 >= 3) {
      setIsSetupComplete(false);
      setTapCount(0);
      if (tapTimeout) clearTimeout(tapTimeout);
    }
  };

  const pickImage = async (type: 'main' | 'id') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required.', [{ text: 'OK' }]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'main' ? [3, 4] : [4, 3],
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
      Alert.alert('Permission Required', 'Permission to access camera is required.', [{ text: 'OK' }]);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'main' ? [3, 4] : [4, 3],
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
        contentContainerStyle={styles.setupScrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.setupHeader}>
          <Text style={styles.setupTitle}>Welcome to IDApp</Text>
          <Text style={styles.setupSubtitle}>Customize your images and view instructions</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>📖 How to Use the App</Text>
          <Text style={styles.instructionText}>
            1. Tap "Main Screen Image" or "ID Screen Image" to choose an image from your library or camera.
          </Text>
          <Text style={styles.instructionText}>
            2. After setup, tap the top-right corner on the main screen to view your ID screen.
          </Text>
          <Text style={styles.instructionText}>
            3. Double-tap anywhere on the ID screen to return to the main screen.
          </Text>
          <Text style={styles.instructionText}>
            4. Triple-tap the top-left corner of the main screen to reopen this setup/settings screen.
          </Text>
          <Text style={styles.instructionText}>
            5. Use the "Reset" buttons in settings to revert images to defaults if needed.
          </Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Main Screen Image</Text>
          <TouchableOpacity 
            style={styles.imageUploadArea}
            onPress={() => showImageOptions('main')}
          >
            <Image 
              source={getImageSource('main')} 
              style={styles.previewImage} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>ID Screen Image</Text>
          <TouchableOpacity 
            style={styles.imageUploadArea}
            onPress={() => showImageOptions('id')}
          >
            <Image 
              source={getImageSource('id')} 
              style={styles.previewImage} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={styles.okButton}
          onPress={() => setIsSetupComplete(true)}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isSetupComplete) return renderSetupScreen();

  return (
    <View style={styles.container}>
      {!showID ? (
        <>
          <Image
            source={getImageSource('main')}
            style={styles.fullScreenImage}
          />
          <TouchableOpacity
            style={styles.topRightButton}
            onPress={() => setShowID(true)}
          >
            <View style={styles.clickArea} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hiddenTapArea}
            onPress={handleTripleTap}
            activeOpacity={1}
          >
            <View style={styles.hiddenClickArea} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.idContainer}>
            <Image
              source={getImageSource('id')}
              style={styles.fullScreenImage}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fullScreenImage: { width: "100%", height: "100%", resizeMode: "cover" },
  topRightButton: { position: "absolute", top: 50, right: 20, width: 80, height: 80 },
  clickArea: { flex: 1, backgroundColor: "transparent" },
  hiddenTapArea: { position: "absolute", top: 50, left: 20, width: 80, height: 80 },
  hiddenClickArea: { flex: 1, backgroundColor: "transparent" },
  idContainer: { flex: 1 },

  setupContainer: { flex: 1, backgroundColor: "#1a1a1a" },
  setupScrollView: { flex: 1 },
  setupScrollContent: { paddingBottom: 20 },
  setupHeader: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  setupTitle: { fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: 'center' },
  setupSubtitle: { fontSize: 16, color: "#cccccc", textAlign: 'center', marginTop: 5 },

  instructionContainer: { backgroundColor: "#333", margin: 20, padding: 15, borderRadius: 8 },
  instructionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFD700", marginBottom: 10 },
  instructionText: { fontSize: 14, color: "#fff", lineHeight: 20, marginBottom: 5 },

  imageSection: { marginBottom: 40, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#ffffff", marginBottom: 15, textAlign: "center" },
  imageUploadArea: { height: 250, borderRadius: 15, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  bottomSpacer: { height: 20 },
  fixedButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: "#1a1a1a", paddingTop: 10, paddingBottom: 40, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: "#333333" },
  okButton: { backgroundColor: "#34C759", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, alignSelf: "center", minWidth: 100 },
  okButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold", textAlign: 'center' },
});
