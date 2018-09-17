module Main where

import Prelude

import Affjax (get, printResponseFormatError, Response, ResponseFormatError)
import Affjax.ResponseFormat (string)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Aff (launchAff, Fiber, Aff, try)
import Effect.Class.Console (log)

type Film = { id::String
            , name :: String
            , cover:: String
            , rating:: Maybe Number
            }

gidonline :: String
gidonline = "http://gidonline.in"

postId :: String
postId = "#posts a"

dataFile :: String
dataFile = "data.json"


pageUrl :: Int -> String
pageUrl pageNumber = gidonline <> "/rating/page/" <> show pageNumber <> "/"

getPage :: Int -> Aff (Response (Either ResponseFormatError String))
getPage = pageUrl >>> get string

main :: Effect (Fiber Unit)
main = launchAff $ do
  r <- try $ get string "https://some.fucking.awsome.does.not.exist"
  case r of
    Left e -> log $ "cannot do request" <> show message
    Right res -> log "ye!"