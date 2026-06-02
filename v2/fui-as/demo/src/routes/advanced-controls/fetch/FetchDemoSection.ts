import {
  Column,
  Fetch,
  FetchRequest,
  FetchResponse,
  FlexBox,
  Row,
  Text,
  Theme,
  Unit,
  activeTheme,
} from "../../../../../src/Fui";
import {
  DemoButton,
  DemoButtonTone,
  DemoText,
  DemoTextRecipe,
  RoutePageSection,
  createRoutePageSection,
  demoMutedText,
  demoPrimaryText,
} from "../../../design-system";

const FONT_REGULAR: u32 = 1;
const JSON_PLACEHOLDER_BASE_URL = "https://jsonplaceholder.typicode.com";
const JSON_PLACEHOLDER_GET_URL = JSON_PLACEHOLDER_BASE_URL + "/posts/1";
const JSON_PLACEHOLDER_POST_URL = JSON_PLACEHOLDER_BASE_URL + "/posts";
const JSON_PLACEHOLDER_POST_BODY =
  '{"title":"EffinDom advanced-controls demo","body":"Posting through the shipped Fetch API.","userId":29}';

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

function startFetchGet(owner: FetchDemoSection): void {
  owner.startGetSample();
}

function startFetchPost(owner: FetchDemoSection): void {
  owner.startPostSample();
}

function handleFetchComplete(owner: FetchDemoSection, response: FetchResponse): void {
  owner.handleRequestComplete(response);
}

function handleFetchError(owner: FetchDemoSection, message: string): void {
  owner.handleRequestError(message);
}

export class FetchDemoSection {
  readonly getButton: DemoButton = new DemoButton("GET /posts/1")
    .width(156.0, Unit.Pixel)
    .onClickWith<FetchDemoSection>(this, startFetchGet) as DemoButton;
  readonly postButton: DemoButton = new DemoButton("POST /posts", DemoButtonTone.Primary)
    .width(156.0, Unit.Pixel)
    .onClickWith<FetchDemoSection>(this, startFetchPost) as DemoButton;
  readonly statusText: Text = new DemoText("", DemoTextRecipe.StatusValue)
    .font(FONT_REGULAR, 15.0) as Text;
  readonly requestText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .font(FONT_REGULAR, 15.0)
    .maxLines(3) as Text;
  readonly resultText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .font(FONT_REGULAR, 15.0)
    .maxLines(5) as Text;
  readonly hintText: Text = new DemoText(
    "This demo uses the shipped Fetch API against the live JSONPlaceholder service. The request is real and online; the current Fetch surface reports completion metadata (ok, status, statusText, resolved url) rather than response bodies.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(6) as Text;

  private readonly sectionBody!: FlexBox;
  private activeRequest: FetchRequest | null = null;
  private activeRequestLabel: string = "";
  private themeValue: Theme = activeTheme.value;

  constructor() {
    this.sectionBody = Column(
      Row(
        this.getButton,
        new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel),
        this.postButton,
      ).fillWidth(),
      verticalSpacer(12.0),
      this.statusText,
      verticalSpacer(6.0),
      this.requestText,
      verticalSpacer(6.0),
      this.resultText,
      verticalSpacer(10.0),
      this.hintText,
    ).fillWidth();
    this.statusText.text("Fetch status: idle");
    this.requestText.text("Latest request: none");
    this.resultText.text("Latest result: none yet");
    this.syncButtons();
    this.applyTheme(this.themeValue);
  }

  buildSection(): RoutePageSection {
    return createRoutePageSection(
      "Online Fetch sample",
      "Send real GET and POST requests through the shipped Fetch API to JSONPlaceholder without dropping to browser-specific networking code.",
      this.sectionBody,
    );
  }

  applyTheme(theme: Theme): void {
    this.themeValue = theme;
    this.statusText.textColor(demoPrimaryText(theme));
    this.requestText.textColor(demoMutedText(theme));
    this.resultText.textColor(demoMutedText(theme));
    this.hintText.textColor(demoMutedText(theme));
  }

  dispose(): void {
    const activeRequest = this.activeRequest;
    this.activeRequest = null;
    this.activeRequestLabel = "";
    if (activeRequest !== null) {
      activeRequest.dispose();
    }
  }

  startGetSample(): void {
    const request = Fetch.request(JSON_PLACEHOLDER_GET_URL);
    this.startRequest("GET " + JSON_PLACEHOLDER_GET_URL, request);
  }

  startPostSample(): void {
    const request = Fetch.request(JSON_PLACEHOLDER_POST_URL)
      .method("POST")
      .header("Content-Type", "application/json; charset=UTF-8")
      .bodyText(JSON_PLACEHOLDER_POST_BODY);
    this.startRequest("POST " + JSON_PLACEHOLDER_POST_URL, request);
  }

  handleRequestComplete(response: FetchResponse): void {
    const requestLabel = this.activeRequestLabel.length > 0 ? this.activeRequestLabel : "Fetch request";
    this.activeRequest = null;
    this.activeRequestLabel = "";
    this.statusText.text("Fetch status: complete");
    this.resultText.text(
      "Latest result: " + requestLabel +
      " -> ok=" + (response.ok ? "true" : "false") +
      " • status " + response.status.toString() +
      " " + response.statusText +
      " • resolved url " + response.url,
    );
    this.syncButtons();
  }

  handleRequestError(message: string): void {
    const requestLabel = this.activeRequestLabel.length > 0 ? this.activeRequestLabel : "Fetch request";
    this.activeRequest = null;
    this.activeRequestLabel = "";
    this.statusText.text("Fetch status: error");
    this.resultText.text("Latest result: " + requestLabel + " -> error • " + message);
    this.syncButtons();
  }

  private startRequest(requestLabel: string, request: FetchRequest): void {
    if (this.activeRequest !== null) {
      this.statusText.text("Fetch status: wait for the current request to finish");
      return;
    }
    this.activeRequest = request
      .onCompleteWith<FetchDemoSection>(this, handleFetchComplete)
      .onErrorWith<FetchDemoSection>(this, handleFetchError)
      .start();
    this.activeRequestLabel = requestLabel;
    this.statusText.text("Fetch status: running");
    this.requestText.text("Latest request: " + requestLabel);
    this.resultText.text("Latest result: waiting for JSONPlaceholder to respond...");
    this.syncButtons();
  }

  private syncButtons(): void {
    const idle = this.activeRequest === null;
    this.getButton.enabled(idle);
    this.postButton.enabled(idle);
  }
}
