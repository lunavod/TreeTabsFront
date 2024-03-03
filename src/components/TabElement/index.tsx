import { observer } from "mobx-react-lite";
import { VivaldiTab, useApi } from "../../api";

import styles from "./styles.module.css";
import clsx from "clsx";
import { useRef, useState, useEffect } from "react";
import FileQuestionIcon from "../../assets/icons/solid/file-circle-question.svg";
import XmarkIcon from "../../assets/icons/solid/xmark.svg";
import VolumeIndicator from "../VolumeIndicator";

const TabElement = observer(
  ({
    tab,
    tabs,
    tabsMap,
    level,
    onContextMenu,
  }: {
    tab: VivaldiTab;
    tabs: VivaldiTab[];
    tabsMap: Record<number, number | undefined>;
    level: number;
    onContextMenu: (e: React.MouseEvent, tab: VivaldiTab) => any;
  }) => {
    const api = useApi();
    const onClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      const target = e.target as HTMLElement;

      let el = target;
      while (el.parentElement) {
        if (
          [...el.classList].includes(styles.closeWithChildren) ||
          [...el.classList].includes(styles.close)
        )
          return;
        el = el.parentElement;
      }

      console.log("ACTIVATING");
      api.update(tab.id as number, { active: true });
    };

    const onCloseClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      e.preventDefault();
      let newActiveTab: number = tabs.find((t) => t.active === true)
        ?.id as number;
      if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
        newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
          .id as number;

      api.remove(tab.id as number).then(() => {
        if (tab.active) return;
        api.update(newActiveTab, { active: true });
      });
    };

    let title = tab.title as string;
    if (tab.url && title.endsWith(` - ${tab.url}`))
      title = title.slice(0, -` - ${tab.url}`.length);

    if (tab.url) {
      const url = new URL(tab.url as string);
      if (url.host === "vivaldi-webui") {
        title = "Vivaldi: New tab ";
        if (url.pathname === "/startpage") {
          if (url.searchParams.get("section") === "history")
            title = "Vivaldi: History";
          if (url.searchParams.get("section") === "Speed-dials")
            title = "Vivaldi: New tab ";
        }
      }
    }

    const getThumbnail = () => {
      const thumb = JSON.parse(
        tab.vivExtData ? tab.vivExtData : '{"thumbnail": ""}'
      ).thumbnail;
      return thumb;
    };

    const timer = useRef<null | NodeJS.Timeout>(null);
    const [popupShown, setPopupShown] = useState(false);

    const onMouseEnter = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPopupShown(true), 500);
    };
    const onMouseLeave = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setPopupShown(false);
    };

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!ref.current) return;
      ref.current.addEventListener(
        "contextmenu",
        // @ts-expect-error I dont remember why I did this
        (e: React.MouseEvent<Element, MouseEvent>) => onContextMenu(e, tab)
      );
    }, []);

    return (
      <div
        styleName="tabWrapper"
        style={
          {
            "--offset": tab.openerTabId ? level * 12 + "px" : "0px",
          } as React.CSSProperties
        }
      >
        <div
          ref={ref}
          key={tab.id}
          styleName={clsx("tab", tab.active && "active")}
          onClick={(e) => onClick(e, tab)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {!!tab.favIconUrl && <img src={tab.favIconUrl} />}
          {!tab.favIconUrl && (
            <div styleName="noFavicon">
              <FileQuestionIcon />
            </div>
          )}
          {!!tab.audible && <VolumeIndicator />}
          <span styleName="title">
            {title} {!!tab.active && "ACTIVE"} {!tab.active && "NO"}
          </span>
          <div styleName="close" onClick={(e) => onCloseClick(e, tab)}>
            <XmarkIcon />
          </div>
        </div>
        <div styleName="popup" style={{ opacity: popupShown ? 1 : 0 }}>
          <span styleName="tabTitle">{title}</span>
          <span styleName="tabUrl">{tab.url}</span>
          {/* <img src={getThumbnail()} styleName="thumbnail" /> */}
        </div>
      </div>
    );
  }
);

export default TabElement;
