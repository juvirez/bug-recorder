import { render } from "react-dom";
import * as React from "react";
import Fab from "@material-ui/core/Fab";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Lens from "@material-ui/icons/Lens";
import Stop from "@material-ui/icons/Stop";
import {
  StartRequest,
  RequestAction,
  StopRequest,
  GetStatusRequest,
  Status
} from "./background";
import { withStyles, createStyles, WithStyles } from "@material-ui/core";
import grey from "@material-ui/core/colors/grey";

const styles = (theme: Theme) =>
  createStyles({
    recordFab: {
      margin: theme.spacing.unit,
      color: "#ec235a",
      backgroundColor: grey[50],
      "&:hover": {
        backgroundColor: grey[200]
      }
    },
    stopFab: {
      margin: theme.spacing.unit
    },
    extendedIcon: {
      marginRight: theme.spacing.unit
    }
  });

interface Props extends WithStyles<typeof styles> {}
interface State {
  recording: boolean;
}

// tslint:disable-next-line: variable-name
const DecoratedPopup = withStyles(styles)(
  class extends React.Component<Props, State> {
    constructor(props: any) {
      super(props);
      const request: GetStatusRequest = {
        action: RequestAction.GetStatus
      };
      chrome.runtime.sendMessage(request, (response: Status) => {
        this.setState(prevState => {
          return { recording: response === Status.Recording };
        });
      });
      this.state = { recording: false };
    }

    start = () => {
      this.setState({ recording: true });
      const tabQueryInfo = { active: true, currentWindow: true };
      chrome.tabs.query(tabQueryInfo, (tabs: chrome.tabs.Tab[]) => {
        const currentTab = tabs.pop();
        if (currentTab != null) {
          const request: StartRequest = {
            action: RequestAction.Start,
            tab: currentTab
          };
          chrome.runtime.sendMessage(request);
        }
      });
    };

    stop = () => {
      this.setState({ recording: false });
      const request: StopRequest = { action: RequestAction.Stop };
      chrome.runtime.sendMessage(request);
    };

    render() {
      const classes = this.props.classes;
      return (
        <div>
          {this.state.recording ? (
            <Fab
              variant="extended"
              className={classes.stopFab}
              onClick={this.stop}
            >
              <Stop className={classes.extendedIcon} />
              stop recording
            </Fab>
          ) : (
            <Fab
              variant="extended"
              className={classes.recordFab}
              onClick={this.start}
            >
              <Lens className={classes.extendedIcon} />
              record the bug
            </Fab>
          )}
        </div>
      );
    }
  }
);

render(<DecoratedPopup />, document.getElementById("root"));