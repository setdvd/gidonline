module Main exposing (..)

import Dict exposing (Dict)
import Html exposing (Html, text, div, h1, img)
import Html.Attributes exposing (src)
import HtmlParser exposing (Attributes, Node, parse)
import HtmlParser.Util exposing (filterMapElements, getElementById, getElementsByTagName, getId, getValue, mapElements, textContent)
import Http exposing (Error)
---- MODEL ----

type alias Model =
    { films: Dict String Film
    , page: Int
    }

type alias Film =
    { id: String
    , name : String
--    , rating: Float
    , cover: String
    }

model: Model
model =
    { films=Dict.empty
    , page=9
    }

init : ( Model, Cmd Msg )
init = ( model, Cmd.batch (List.range 1 model.page |> List.map loadFilms))


---- UPDATE ----

type Msg = NoOp | Load (Result Http.Error String)

siteURL: String
siteURL = "http://gidonline.in"

postsId: String
postsId = "posts"

onePostClass: String
onePostClass = "mainlink"

maxPage: Int
maxPage = 100

urlForPageNumber: Int -> String
urlForPageNumber page = ("/rating/page/" ++ toString(page) ++ "/")

loadFilms: Int -> Cmd Msg
loadFilms page =
    urlForPageNumber page |> sendRequest Load

sendRequest: (Result Error String -> msg) -> String -> Cmd msg
sendRequest msg path =
    let
        url = siteURL ++ path
        request = Http.getString url
    in
        Http.send msg request

getName: String -> Attributes -> List Node -> Maybe String
getName tag attr child = getElementsByTagName "span" child |> textContent |> Just

getCover: String -> Attributes -> List Node -> Maybe String
getCover tag attrs child = filterMapElements (\ _ attributes _ -> getValue "src" attributes ) child |> List.head

getId: String -> Attributes -> List Node -> Maybe String
getId tag attr child = getValue "href" attr

parseFilm: String -> Attributes -> List Node -> Maybe Film
parseFilm tag attrs child =
    let
        cover = getCover tag attrs child
        name = getName tag attrs child
        id = getId tag attrs child
    in
        Maybe.map3 Film id name cover


onlyJust: List (Maybe a) -> List a
onlyJust = List.filterMap identity

parseFilmsOnPage: String -> List Film
parseFilmsOnPage page =
        parse page
        |> getElementById postsId
        |> mapElements (\ _ _ post -> mapElements parseFilm post)
        |> List.concat
        |> onlyJust
        |> Debug.log "films"



insertFilm: Film -> Dict String Film -> Dict String Film
insertFilm film dic = Dict.insert film.id film dic


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        noop = (model, Cmd.none)
    in
        case msg of
            Load (Ok pageText) ->
                let
                    films = parseFilmsOnPage pageText
                    filmDict = List.foldr insertFilm model.films films
                    newModel = {model | films = filmDict, page = model.page + 1}
                    nextPage = newModel.page
                    cmd = Debug.log "cmd" (if nextPage < maxPage then loadFilms nextPage else  Cmd.none)
                in
                   (newModel, cmd)
            Load (Err e) ->
                    let
                        i = Debug.log "error loading page" e
                    in
                        noop
            NoOp -> noop



---- VIEW ----

view : Model -> Html Msg
view model =
    div []
        [ img [ src "/logo.svg" ] []
        , h1 [] [ text (toString model.page )]
        ]




---- PROGRAM ----

main : Program Never Model Msg
main =
    Html.program
        { view = view
        , init = init
        , update = update
        , subscriptions = always Sub.none
        }
