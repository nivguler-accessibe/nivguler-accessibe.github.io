import com.acsbe.accessflow.AccessFlowSDK;
import com.google.gson.GsonBuilder;
import com.microsoft.playwright.*;
import org.junit.jupiter.api.Test;
import java.nio.file.*;

class LabTest {
  @Test void lab() throws Exception {
    try (Playwright pw = Playwright.create()) {
      String exe = System.getenv("PW_CHROMIUM_PATH"); // optional: a newer local Chromium
      BrowserType.LaunchOptions opts = new BrowserType.LaunchOptions();
      if (exe != null) opts.setExecutablePath(Path.of(exe));
      Page page = pw.chromium().launch(opts).newPage();
      page.navigate("https://nivguler-accessibe.github.io/");
      AccessFlowSDK sdk = new AccessFlowSDK(page);
      var report = sdk.generateReport(sdk.audit());
      Files.writeString(Path.of("report.json"), new GsonBuilder().setPrettyPrinting().create().toJson(report));
    }
  }
}
