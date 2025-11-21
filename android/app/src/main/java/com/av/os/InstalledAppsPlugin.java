package com.av.os;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.provider.Settings; // <--- Added this import
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    @PluginMethod
    public void getApps(PluginCall call) {
        new Thread(() -> { // Run in background to stop UI freeze
            PackageManager pm = getContext().getPackageManager();
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> apps = pm.queryIntentActivities(mainIntent, 0);

            // Sort A-Z
            Collections.sort(apps, new Comparator<ResolveInfo>() {
                @Override
                public int compare(ResolveInfo a, ResolveInfo b) {
                    return String.CASE_INSENSITIVE_ORDER.compare(
                            a.loadLabel(pm).toString(),
                            b.loadLabel(pm).toString()
                    );
                }
            });

            JSArray appsList = new JSArray();
            Context context = getContext();

            for (ResolveInfo app : apps) {
                String pkg = app.activityInfo.packageName;
                String label = app.loadLabel(pm).toString();

                // SAVE ICON TO FILE instead of Base64 (Much faster!)
                String iconPath = "";
                try {
                    File cacheDir = new File(context.getCacheDir(), "icons");
                    if (!cacheDir.exists()) cacheDir.mkdirs();

                    File iconFile = new File(cacheDir, pkg + ".png");

                    // Only save if it doesn't exist (Caching)
                    if (!iconFile.exists()) {
                        Drawable drawable = app.loadIcon(pm);
                        Bitmap bitmap = drawableToBitmap(drawable);
                        FileOutputStream out = new FileOutputStream(iconFile);
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
                        out.flush();
                        out.close();
                    }

                    // This magic string lets Capacitor WebView read the local file
                    iconPath = "/_capacitor_file_" + iconFile.getAbsolutePath();
                } catch (Exception e) {
                    e.printStackTrace();
                }

                JSObject appObj = new JSObject();
                appObj.put("label", label);
                appObj.put("packageName", pkg);
                appObj.put("icon", iconPath);
                appsList.put(appObj);
            }

            JSObject ret = new JSObject();
            ret.put("apps", appsList);

            // Send back to main thread
            getActivity().runOnUiThread(() -> call.resolve(ret));
        }).start();
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String packageName = call.getString("packageName");
        Intent launchIntent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
        if (launchIntent != null) {
            getContext().startActivity(launchIntent);
            call.resolve();
        } else {
            call.reject("App not found");
        }
    }

    @PluginMethod
    public void requestDefaultLauncher(PluginCall call) {
        // --- UPDATED SAFE VERSION ---
        // This tries to open the specific "Default Home App" settings.
        // If that fails, it opens the main settings menu.
        try {
            Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent intent = new Intent(Settings.ACTION_SETTINGS);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Could not open settings");
            }
        }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
        if (drawable instanceof BitmapDrawable) return ((BitmapDrawable) drawable).getBitmap();
        Bitmap bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bitmap;
    }
}