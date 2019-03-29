import { render } from "react-dom";
import * as React from "react";
import Fab from "@material-ui/core/Fab";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import { Lens } from "@material-ui/icons";
import { StartRequest, RequestAction, StopRequest } from "./background";
import { withStyles, createStyles, WithStyles } from "@material-ui/core";
import grey from "@material-ui/core/colors/grey";

const styles = (theme: Theme) =>
  createStyles({
    recordingFab: {
      margin: theme.spacing.unit,
      color: "#ec235a",
      backgroundColor: grey[50],
      "&:hover": {
        backgroundColor: grey[200]
      }
    },
    extendedIcon: {
      marginRight: theme.spacing.unit
    }
  });

interface Props extends WithStyles<typeof styles> {}

const DecoratedPopup = withStyles(styles)(
  class extends React.Component<Props> {
    constructor(props: any) {
      super(props);
    }

    start() {
      const tabQueryInfo = { active: true, currentWindow: true };
      chrome.tabs.query(tabQueryInfo, (tabs: chrome.tabs.Tab[]) => {
        const currentTab = tabs.pop();
        if (currentTab != null) {
          const request: StartRequest = {
            action: RequestAction.Start,
            tab: currentTab,
            recordVideo: true
          };
          chrome.runtime.sendMessage(request);
        }
      });
    }

    stop() {
      const request: StopRequest = { action: RequestAction.Stop };
      chrome.runtime.sendMessage(request);
    }

    render() {
      const classes = this.props.classes;
      return (
        <div>
          <Fab variant="extended" className={classes.recordingFab}>
            <Lens className={classes.extendedIcon} />
            record the bug
          </Fab>
        </div>
      );
    }
  }
);

render(<DecoratedPopup />, document.getElementById("root"));
