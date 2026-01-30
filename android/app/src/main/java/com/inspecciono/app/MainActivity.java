package com.inspecciono.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private static final String TAG = "MainActivity";

    @Override
    public void onStart() {
        super.onStart();
        // ✅ Log del SHA-1 del certificado cuando la actividad inicia
        logCertificateInfo();
    }

    /**
     * ✅ Obtener y loguear información del certificado (SHA-1)
     * Esto ayuda a verificar que el SHA-1 usado coincide con el de Google Cloud Console
     */
    private void logCertificateInfo() {
        try {
            PackageInfo packageInfo = getPackageManager().getPackageInfo(
                getPackageName(),
                PackageManager.GET_SIGNATURES
            );
            
            for (Signature signature : packageInfo.signatures) {
                MessageDigest md = MessageDigest.getInstance("SHA-1");
                md.update(signature.toByteArray());
                byte[] digest = md.digest();
                
                // Convertir a formato hexadecimal con dos puntos
                StringBuilder sha1 = new StringBuilder();
                for (int i = 0; i < digest.length; i++) {
                    if (i > 0) sha1.append(":");
                    sha1.append(String.format("%02X", digest[i]));
                }
                
                Log.i(TAG, "🔐 [Certificate] SHA-1 del certificado de la app: " + sha1.toString());
                Log.i(TAG, "🔐 [Certificate] SHA-1 esperado en Google Cloud: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10");
                Log.i(TAG, "🔐 [Certificate] Package name: " + getPackageName());
                Log.i(TAG, "🔐 [Certificate] ¿SHA-1 coincide?: " + sha1.toString().equalsIgnoreCase("A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10"));
            }
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "❌ [Certificate] Error obteniendo package info: " + e.getMessage());
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "❌ [Certificate] Error calculando SHA-1: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "❌ [Certificate] Error inesperado: " + e.getMessage());
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        Log.i(TAG, "📥 [GoogleSignIn] onActivityResult - requestCode: " + requestCode + ", resultCode: " + resultCode);
        Log.i(TAG, "📥 [GoogleSignIn] Request code range: " + GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN + " - " + GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX);
        
        // Manejar resultados de Google Sign-In con scopes
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            
            Log.i(TAG, "✅ [GoogleSignIn] Request code está en el rango correcto para Google Sign-In");
            
            if (resultCode == RESULT_CANCELED) {
                Log.w(TAG, "⚠️ [GoogleSignIn] Result code es RESULT_CANCELED - Usuario canceló o error de configuración");
                if (data != null) {
                    Log.w(TAG, "⚠️ [GoogleSignIn] Intent data: " + data.toString());
                    if (data.getExtras() != null) {
                        Log.w(TAG, "⚠️ [GoogleSignIn] Intent extras: " + data.getExtras().toString());
                    }
                } else {
                    Log.w(TAG, "⚠️ [GoogleSignIn] Intent data es null - Posible error de SHA-1 o configuración");
                }
            } else if (resultCode == RESULT_OK) {
                Log.i(TAG, "✅ [GoogleSignIn] Result code es RESULT_OK - Autenticación exitosa");
            } else {
                Log.i(TAG, "ℹ️ [GoogleSignIn] Result code: " + resultCode);
            }
            
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.e(TAG, "❌ [GoogleSignIn] SocialLogin plugin not found");
                return;
            }
            
            Log.i(TAG, "✅ [GoogleSignIn] SocialLogin plugin encontrado, delegando manejo...");
            Plugin plugin = pluginHandle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
                Log.i(TAG, "✅ [GoogleSignIn] handleGoogleLoginIntent llamado");
            } else {
                Log.e(TAG, "❌ [GoogleSignIn] Plugin no es instancia de SocialLoginPlugin");
            }
        } else {
            Log.d(TAG, "ℹ️ [GoogleSignIn] Request code no es para Google Sign-In, ignorando");
        }
    }

    // Esta función nunca se llama, déjala vacía
    // Es requerida por la interfaz ModifiedMainActivityForSocialLoginPlugin
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
