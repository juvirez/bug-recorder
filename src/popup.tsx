import { render } from "react-dom";
import * as React from "react";
import Fab from "@material-ui/core/Fab";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Stop from "@material-ui/icons/Stop";
import { StartRequest, RequestAction, StopRequest, GetStatusRequest, Status } from "./api";
import { withStyles, createStyles, WithStyles } from "@material-ui/core";
import grey from "@material-ui/core/colors/grey";
import { AppIcon } from "./icon";
import Typography from "@material-ui/core/Typography";

const styles = (theme: Theme) =>
  createStyles({
    recordFab: {
      width: "187px",
      color: "#ec235a",
      marginBottom: "15px",
      backgroundColor: grey[50],
      "&:hover": {
        backgroundColor: grey[200]
      }
    },
    stopFab: {
      width: "187px",
      marginBottom: "15px"
    },
    buttonWrapper: {
      margin: "20px",
      width: "187px",
      textAlign: "center"
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
      if (this.state.recording) {
        return (
          <div className={classes.buttonWrapper}>
            <Fab variant="extended" className={classes.stopFab} onClick={this.stop}>
              <Stop className={classes.extendedIcon} />
              stop recording
            </Fab>
            <Typography variant="caption">
              click when you have reproduced
              <br />
              the issue on the page
            </Typography>
          </div>
        );
      } else {
        return (
          <div className={classes.buttonWrapper}>
            <Fab variant="extended" className={classes.recordFab} onClick={this.start}>
              <span className={classes.extendedIcon}>
                <AppIcon />
              </span>
              start recording
            </Fab>
            <Typography variant="caption">
              this will reload the page
              <br />
              and start recording
            </Typography>
          </div>
        );
      }
    }
  }
);

render(<DecoratedPopup />, document.getElementById("root"));
