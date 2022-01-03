import {
  CSSObject,
  Icon,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpoint,
  useBreakpointValue,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiMovie } from "react-icons/bi";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router";
import { Column, useSortBy, useTable } from "react-table";
import { useClipboardWithToast } from "../../modules/common/clipboard";
import { useStoreActions, useStoreState } from "../../store";
import { formatSeconds } from "../../utils/SongHelper";
import { MTHolodex, MTHolodexIcon } from "../common/MTHolodex";
import { NowPlayingIcon } from "../common/NowPlayingIcon";
import {
  ContextMenuItem,
  ContextMenuList,
  useContextTrigger,
} from "../context-menu";
import { SongLikeButton } from "../song/SongLikeButton";
import { PlaylistSongTableDropDownMenu } from "./SongTableDropdownButton";

type IndexedSong = Song & { idx: number };

export interface SongTableProps {
  songs: Song[];

  // reactive hooks:
  songClicked?: (e: React.MouseEvent, s: Song) => void;
  songDropdownMenuRenderer?: (cellInfo: any) => JSX.Element;
  songRightClickContextMenuRenderer?: (_: {
    song: Song;
    menuId: string;
    closeContextMenu: () => void;
  }) => JSX.Element;

  // table controls:
  isSortable?: boolean; // default true

  menuId?: string;
}

const COLUMN_MIN_WIDTHS: { [key: string]: string } = {
  idx: "40px",
  // 'dur': '20px',
  "...": "100px",
};

export const SongTable = ({
  songs,
  songClicked,
  songDropdownMenuRenderer,
  songRightClickContextMenuRenderer,
  isSortable = true,
  menuId,
}: SongTableProps) => {
  const { t } = useTranslation();
  // const t = (str: string, ..._: { date: Date; }[]) => str;
  const queueSongs = useStoreActions((actions) => actions.playback.queueSongs);
  const s: IndexedSong[] = React.useMemo(() => {
    return songs.map((v, i) => {
      return { ...v, idx: i + 1 };
    });
  }, [songs]);
  const currentId = useStoreState(
    (state) => state.playback.currentlyPlaying?.song?.id
  );
  // const [front,front2] = useCOlorMode

  const columns: Column<IndexedSong>[] = React.useMemo<Column<IndexedSong>[]>(
    () => [
      {
        Header: "#",
        accessor: "idx",
        maxWidth: 40,
        minWidth: 40,
        width: 40,
        Cell: (cellInfo: any) => {
          return cellInfo.row.original.id === currentId ? (
            <NowPlayingIcon style={{ color: "var(--chakra-colors-n2-400)" }} />
          ) : (
            cellInfo.row.original.idx
          );
        },
      },
      {
        Header: "Title",
        accessor: "name",
        Cell: (cellInfo: any) => {
          return (
            <VStack alignItems="start" spacing={1}>
              <span>{cellInfo.row.original?.name}</span>
              <Text color="whiteAlpha.600" fontWeight={300} fontSize="sm">
                {cellInfo.row.original.channel?.name}
              </Text>
            </VStack>
          );
        },
      },
      {
        id: "channel",
        Header: "ChannelName",
        accessor: (row: IndexedSong) =>
          row.channel?.english_name || row.channel?.name,
      },
      {
        Header: "Original Artist",
        accessor: "original_artist",
      },
      {
        id: "dur",
        Header: "Duration",
        accessor: (row: { end: number; start: number }) => {
          return formatSeconds(row.end - row.start);
        },
        isNumeric: true,
        Cell: (cellInfo: any) => {
          return (
            <>
              {cellInfo.row.original.is_mv && (
                <Icon
                  mb="-3px"
                  mr={3}
                  as={BiMovie}
                  title="MV"
                  color="gray.500"
                ></Icon>
              )}{" "}
              {cellInfo.value}
            </>
          );
        },
      },
      {
        id: "date",
        Header: "Sang On",
        accessor: (row: { available_at: Date }) =>
          t("relativeDate", { date: new Date(row?.available_at) }),
      },
      {
        id: "...",
        Header: "",
        disableSortBy: true,
        accessor: "idx",
        Cell: (cellInfo: any) => {
          return songDropdownMenuRenderer ? (
            songDropdownMenuRenderer(cellInfo)
          ) : (
            <PlaylistSongTableDropDownMenu song={cellInfo.row.original} />
          );
        },
      },
    ],
    [currentId, t, songDropdownMenuRenderer]
  );

  const showAddDialog = useStoreActions(
    (action) => action.addPlaylist.showPlaylistAddDialog
  );

  const copyToClipboard = useClipboardWithToast();

  const navigate = useNavigate();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    toggleHideColumn,
  } = useTable(
    {
      columns: columns as any,
      data: s,
      initialState: { hiddenColumns: ["channel"] },
      disableSortBy: !isSortable,
    },
    useSortBy
  );

  const isXL = useBreakpointValue(
    { base: 0, xs: 0, sm: 1, md: 2, xl: 3 },
    "md"
  );

  useEffect(() => {
    if (isXL === undefined) return;
    toggleHideColumn("original_artist", isXL < 3);
    toggleHideColumn("idx", isXL < 3);
    toggleHideColumn("date", isXL < 2);
    toggleHideColumn("dur", isXL < 1);
  }, [isXL, toggleHideColumn]);

  const [menuIdStat] = useState(
    () => menuId || "st" + Math.floor(Math.random() * 100000).toString()
  );

  const contextMenuTrigger = useContextTrigger({ menuId: menuIdStat });

  const HOVER_ROW_STYLE: CSSObject = {
    backgroundColor: useColorModeValue("bgAlpha.200", "bgAlpha.800"),
  };

  const defaultClickBehavior = (
    e: React.MouseEvent<any, MouseEvent>,
    song: Song
  ) => {
    queueSongs({
      songs: [song],
      immediatelyPlay: true,
    });
  };

  return (
    <>
      <ContextMenuList
        menuId={menuIdStat}
        render={({ menuId, closeContextMenus, passData: song }) => {
          if (songRightClickContextMenuRenderer)
            return songRightClickContextMenuRenderer({
              menuId,
              closeContextMenu: closeContextMenus,
              song,
            });

          return (
            <>
              <ContextMenuItem
                onClick={() => {
                  queueSongs({ songs: [song], immediatelyPlay: false });
                }}
                colorScheme="gray"
              >
                Add to queue
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  copyToClipboard(`${window.location.origin}/song/${song.id}`);
                }}
                colorScheme="gray"
              >
                Copy Song Link
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  showAddDialog(song);
                }}
                colorScheme="gray"
              >
                Add To Playlist...
              </ContextMenuItem>
              <hr style={{ marginTop: "0.4rem", marginBottom: "0.4rem" }} />
              <ContextMenuItem
                onClick={() => {
                  navigate("/song/" + song.id);
                }}
                colorScheme="gray"
              >
                Go To Song Page
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => navigate("/video/" + song.video_id)}
                colorScheme="gray"
              >
                Go To Video Page
              </ContextMenuItem>
              <ContextMenuItem
                onClick={({ passData }) => {}}
                colorScheme="gray"
              >
                Go To Channel Page
              </ContextMenuItem>
            </>
          );
        }}
      ></ContextMenuList>

      <Table {...getTableProps()} size={isXL! >= 1 ? "md" : "sm"}>
        <Thead>
          {headerGroups.map((headerGroup) => (
            <Tr {...headerGroup.getHeaderGroupProps()} px={2}>
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  isNumeric={(column as any).isNumeric}
                  px={{ xl: 3, base: 2 }}
                >
                  {column.isSorted &&
                    (column.isSortedDesc ? (
                      <Icon as={FaChevronDown} display="inline" mr="2" />
                    ) : (
                      <Icon as={FaChevronUp} display="inline" mr="2" />
                    ))}
                  {column.render("Header")}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row, index) => {
            prepareRow(row);
            return (
              <Tr
                {...row.getRowProps()}
                onContextMenu={(e) => {
                  contextMenuTrigger(e, row.original);
                }}
                key={menuIdStat + "_" + row.original.id + "_" + index}
                _hover={HOVER_ROW_STYLE}
                // onMouseEnter={() => setHoverIndex(index)}
                // onMouseLeave={() => setHoverIndex(null)}
              >
                {row.cells.map((cell) => (
                  <Td
                    {...cell.getCellProps()}
                    isNumeric={(cell.column as any).isNumeric}
                    {...{
                      width: COLUMN_MIN_WIDTHS?.[cell.column.id] || "auto",
                    }}
                    {...(cell.column.id !== "..."
                      ? {
                          onClick: (e) => {
                            if (window.getSelection()?.toString()?.length)
                              return e.preventDefault();
                            songClicked
                              ? songClicked(e, row.original)
                              : defaultClickBehavior(e as any, row.original);
                          },
                        }
                      : {})}
                    px={{ xl: 3, base: 2 }}
                  >
                    {cell.column.id === "..." && (
                      <SongLikeButton song={row.original} />
                    )}
                    {cell.render("Cell")}
                  </Td>
                ))}
              </Tr>
            );
          })}
        </Tbody>
        {/* <Tfoot>
          {headerGroups.map((headerGroup) => (
            <Tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  isNumeric={(column as any).isNumeric}
                >
                  {column.render("Header")}
                  <Box pl="4">
                    {column.isSorted ? (column.isSortedDesc ? "v" : "^") : ""}
                  </Box>
                </Th>
              ))}
            </Tr>
          ))}
        </Tfoot> */}
      </Table>
    </>
  );
};
