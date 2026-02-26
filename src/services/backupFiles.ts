import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function exportTextToLocalFile(input: {
  filename: string;
  content: string;
  mimeType: string;
  dialogTitle: string;
}) {
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!base) throw new Error("Diretório local indisponível para exportação.");

  const uri = `${base}${input.filename}`;
  await FileSystem.writeAsStringAsync(uri, input.content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = Platform.OS !== "web" && (await Sharing.isAvailableAsync());
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: input.mimeType,
      dialogTitle: input.dialogTitle,
      UTI: input.mimeType,
    });
  }

  return uri;
}

export async function pickImportTextFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/csv", "text/plain"],
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets.length) return null;

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return {
    name: file.name || "backup.txt",
    uri: file.uri,
    content,
  };
}
